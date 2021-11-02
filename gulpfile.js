'use strict';

const fs = require('fs');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const clean = require('gulp-clean');
const rimraf = require('rimraf');

gulp.task('mkdir', (cb) => {
  fs.mkdirSync('./dist/cache', { recursive: true });
  fs.mkdirSync('./src/cache', { recursive: true });
  cb();
});

gulp.task('compile', () =>
  gulp.src(['src/**/*.ts']).pipe(ts.createProject('tsconfig.json')()).pipe(gulp.dest('dist/')),
);

gulp.task('copy-resource', (cb) => {
  gulp.src(['src/build/**/*']).pipe(gulp.dest('dist/build'));
  gulp.src(['src/public/**/*']).pipe(gulp.dest('dist/public'));
  gulp.src(['src/@types/**/*']).pipe(gulp.dest('dist/@types'));
  cb();
});

gulp.task('clean', () => Promise.all([rimrafAsync('dist'), rimrafAsync('src/cache')]));

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
