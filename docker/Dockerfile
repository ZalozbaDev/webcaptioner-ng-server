FROM node:20.11.1-bookworm
MAINTAINER Daniel Sobe <daniel.sobe@sorben.com>

# docker build -f docker/Dockerfile -t webcaptioner-ng-back .
# docker build -f docker/Dockerfile -t webcaptioner-ng-back . --no-cache

RUN mkdir -p /webcaptioner-ng-back/src && chown 1000:1000 /webcaptioner-ng-back/src

COPY --chown=1000:1000 package.json package-lock.json tsconfig.json /webcaptioner-ng-back/
COPY --chown=1000:1000 src    /webcaptioner-ng-back/src

RUN cd webcaptioner-ng-back && npm install && cd .. && chown -R 1000:1000 /webcaptioner-ng-back/

COPY --chown=1000:1000 docker/startme.sh /

USER 1000

CMD ["/bin/bash", "-c", "/startme.sh"] 
