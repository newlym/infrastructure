FROM public.ecr.aws/lambda/nodejs:16

COPY *.ts tsconfig.json package*.json ./

RUN npm install
RUN npm run compile

CMD ["app.handler"]