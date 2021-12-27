'use strict';

const fs = require('fs');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const rimraf = require('rimraf');

gulp.task('mkdir', (cb) => {
  fs.mkdirSync('./dist/cache', { recursive: true });
  fs.mkdirSync('./src/cache', { recursive: true });
  cb();
});

gulp.task('compile', () =>
  gulp.src(['src/**/*.ts']).pipe(ts.createProject('tsconfig.json')()).pipe(gulp.dest('dist/')),
);

gulp.task('copy-resource', () =>
  gulp.src(['src/**/*', '!src/.env', '!src/**/*.ts'], { allowEmpty: true }).pipe(gulp.dest('dist')),
);

gulp.task('clean', () => Promise.all([rimrafAsync('dist'), rimrafAsync('src/cache'), rimrafAsync('src/log')]));

function rimrafAsync(fpath) {
  return new Promise((resolve, reject) => {
    rimraf(fpath, (error) => {
      if (error) {
        if (error.code === 'ENOENT') {
          return resolve();
        }
        return reject();
      }
      return resolve();
    });
  });
}

gulp.task('default', gulp.series(['clean', 'mkdir', 'compile', 'copy-resource']));

gulp.task('watch', () => gulp.watch('src/**/*', 'compile'));
