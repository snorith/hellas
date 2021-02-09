
## Development
```shell
npm run build

## or

npm run build:watch

## or

npm run clean
```

## Production
```shell
NODE_ENV=production npm run build --production
NODE_ENV=production npm run package --production
NODE_ENV=production node_modules/gulp/bin/gulp.js publish -u 0.1.3 --production
```
