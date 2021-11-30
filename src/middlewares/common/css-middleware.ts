import color from 'color-normalize';
import { ChromeCommand } from 'tdf-devtools-protocol/dist/types/enum-chrome-mapping';
import { MiddleWareManager } from '../middleware-context';

export const cssMiddleWareManager: MiddleWareManager = {
  downwardMiddleWareListMap: {
    [ChromeCommand.CSSGetMatchedStylesForNode]: ({ msg, sendToDevtools }) => {
      // 类型收窄
      const commandRes = msg as Adapter.CDP.CommandRes<ProtocolIOS90.CSS.GetInlineStylesForNodeResponse>;
      commandRes.result.inlineStyle = CssDomain.conversionInlineStyle(commandRes.result.inlineStyle);
      return sendToDevtools(commandRes);
    },
    [ChromeCommand.CSSGetComputedStyleForNode]: ({ msg, sendToDevtools }) => {
      const commandRes = msg as Adapter.CDP.CommandRes<ProtocolIOS90.CSS.GetComputedStyleForNodeResponse>;
      commandRes.result.computedStyle = CssDomain.conversionComputedStyle(commandRes.result.computedStyle);
      return sendToDevtools(commandRes);
    },
    [ChromeCommand.CSSSetStyleTexts]: ({ msg, sendToDevtools }) => {
      const commandRes = msg as Adapter.CDP.CommandRes<ProtocolChrome.CSS.SetStyleTextsResponse>;
      commandRes.result.styles = commandRes.result.styles.map((style) => CssDomain.conversionInlineStyle(style));
      return sendToDevtools(commandRes);
    },
  },
  upwardMiddleWareListMap: {
    [ChromeCommand.CSSSetStyleTexts]: ({ msg, sendToApp }) => {
      const req = msg as Adapter.CDP.Req<ProtocolChrome.CSS.SetStyleTextsRequest>;
      req.params.edits = req.params.edits.map((data) => {
        const textList = data.text
          .trim()
          .split(';')
          .reduce((ret, styleItem) => {
            if (!styleItem.trim()) return ret;
            const styleItems = styleItem.split(':');
            const [name] = styleItems;
            let [, ...values] = styleItems;
            if (!CssDomain.shouldSkipStyle(name)) {
              if (name.toLowerCase().includes('color')) {
                const rgba = CssDomain.transformRGBA(values[0]);
                values = [String(CssDomain.rgbaToInt(rgba))];
              }
              ret.push(`${name}: ${values.join(':').trim()}`);
            }
            return ret;
          }, []);
        const totalCSSText = textList.join(';');
        return {
          ...data,
          range: {
            ...data.range,
            endColumn: totalCSSText.length,
          },
          text: totalCSSText,
        };
      });
      return sendToApp(req);
    },
  },
};

class CssDomain {
  private static skipStyleList = ['backgroundImage', 'transform', 'shadowOffset'];

  public static intToRGBA(int32Color: number): string {
    const int = int32Color << 0;
    const int32 = ((int << 8) | (int >>> 24)) >>> 0;
    const int8 = new Uint8Array(new Uint32Array([int32]).buffer).reverse();
    const r = int8[0];
    const g = int8[1];
    const b = int8[2];
    const a = Math.round((int8[3] / 255) * 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  public static rgbaToInt(stringColor: string): number {
    const uint8 = color(stringColor, 'uint8');
    const int = Buffer.from(uint8).readUInt32BE(0);
    return ((int << 24) | (int >>> 8)) >>> 0;
  }

  public static shouldSkipStyle(styleName: string): boolean {
    return CssDomain.skipStyleList.some(
      (name) => name.toString().trim().toLowerCase() === styleName.toString().trim().toLowerCase(),
    );
  }

  public static conversionInlineStyle(style: ProtocolIOS90.CSS.CSSStyle): ProtocolChrome.CSS.CSSStyle {
    let totalCSSText = '';
    style.cssProperties = style.cssProperties.reduce((ret, item) => {
      if (CssDomain.shouldSkipStyle(item.name)) return ret;

      const cssText = `${item.name}: ${item.value}`;
      if (item.name.toLowerCase().includes('color')) {
        item.value = CssDomain.intToRGBA(parseInt(item.value, 10));
      }
      item.range = {
        ...item.range,
        startColumn: totalCSSText.length,
        endColumn: totalCSSText.length + cssText.length + 1,
      };
      totalCSSText += `${cssText}; `;
      ret.push(item);
      return ret;
    }, []);
    style.cssText = totalCSSText;
    style.range = {
      ...style.range,
      endColumn: totalCSSText.length,
    };
    return style;
  }

  public static conversionComputedStyle(
    style: ProtocolIOS90.CSS.CSSComputedStyleProperty[],
  ): ProtocolChrome.CSS.CSSComputedStyleProperty[] {
    if (!style) return [];
    return style.reduce((ret, item) => {
      if (!CssDomain.shouldSkipStyle(item.name)) {
        if (item.name.toLowerCase().includes('color')) {
          item.value = CssDomain.intToRGBA(parseInt(item.value, 10));
        }
        ret.push(item);
      }
      return ret;
    }, []);
  }

  /**
   * alpha 百分比转为小数点形式
   */
  public static transformRGBA(colorText: string): string {
    return colorText.trim().replace(/^rgba?\(([^()]+)\)$/i, (s, p1) => {
      const flag = p1.includes(',') ? ',' : ' ';
      const channelList = p1.split(flag);
      const r = channelList[0];
      const g = channelList[1];
      const b = channelList[2];
      let a = channelList.length > 3 ? channelList[channelList.length - 1] : 1;
      if (a.toString().includes('%')) {
        a = parseInt(a, 10) / 100;
      }
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    });
  }
}
