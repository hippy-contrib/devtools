FROM csighub.tencentyun.com/tsw/tsw:latest
LABEL maintainer="chestershen@tencent.com"
RUN mkdir -p /data/release/devtools-debug-server
WORKDIR /data/release/devtools-debug-server
COPY . .
# COPY dist dist
# COPY package.json .
# COPY package-lock.json .
# RUN npm i --registry=http://mirrors.tencent.com/npm/

ARG REDIS_PWD
ARG REDIS_PRIVATE_HOST
ARG REDIS_PRIVATE_PORT

ENV REDIS_PWD=$REDIS_PWD
ENV REDIS_HOST=$REDIS_PRIVATE_HOST
ENV REDIS_PORT=$REDIS_PRIVATE_PORT

CMD ["node", "dist", "--dbType=redis", "--isRemote=true"]

EXPOSE 38989
