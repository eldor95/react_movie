FROM node
RUN mkdir -p /var/node
ADD . /var/node/
WORKDIR /var/node
RUN npm install
CMD ./bin/www