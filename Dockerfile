FROM node:carbon-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app

EXPOSE 3000
ENV OAUTH_CLIENT_ID=YOUR_OAUTH_CLIENT_ID OAUTH_CLIENT_SECRET=YOUR_OAUTH_CLIENT_SECRET OAUTH_CALLBACK_URL=YOUR_OAUTH_REDIRECT_URL

CMD [ "npm", "start" ]
