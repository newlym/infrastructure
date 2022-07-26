# Build
FROM public.ecr.aws/lambda/nodejs:16 as build

WORKDIR /usr/local

COPY *.ts tsconfig.json package*.json ./

RUN npm ci
RUN npm run compile

# Deploy
FROM public.ecr.aws/lambda/nodejs:16

COPY --from=build /usr/local/*.js /usr/local/package*.json ./

RUN npm ci --production

CMD ["app.handler"]