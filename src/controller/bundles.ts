import { config } from '@/config';
import { getDBOperator } from '@/db';

export class BundleManager {
  /**
   * 查询 bundle
   */
  public static get = async (hash: string): Promise<Bundle[]> => {
    const { model } = getDBOperator();
    return model.get(config.redis.bundleTable, hash);
  };

  /**
   * 保存 bundle
   */
  public static async add(bundle: Bundle) {
    const { model } = getDBOperator();
    return model.upsert(config.redis.bundleTable, bundle.hash, bundle);
  }

  public static async remove(hash: string) {
    const { model } = getDBOperator();
    model.delete(config.redis.bundleTable, hash);
  }
}
