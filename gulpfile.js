const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const connect = require('gulp-connect');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const imageMin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');

const directories = {
  css: './src/css/**/*.css',
  js: './src/js/**/*.js',
  html: './src/*.html',
  images: './src/img/**/*.*',
  output: './dist/'
};

gulp.task('default', ['html', 'styles', 'js', 'images', 'sw'], () => {
  connect.server({
    root: 'dist',
    livereload: true,
  });

  gulp.watch(directories.css, ['styles']);
  gulp.watch(directories.js, ['js']);
  gulp.watch(directories.html, ['html']);
});

gulp.task('html', () => {
  return gulp
    .src(['./src/index.html', './src/restaurant.html'])
    .pipe(gulp.dest(directories.output))
    .pipe(connect.reload());
});

gulp.task('styles', () => {
  return gulp
    .src(directories.css)
    .pipe(autoprefixer({browsers: ['last 4 versions']}))
    .pipe(concat('styles.css'))
    .pipe(gulp.dest(directories.output + 'css'))
    .pipe(connect.reload());
});

gulp.task('js', () => {
  return gulp
    .src(directories.js)
    .pipe(babel({
      presets: ['@babel/env'],
    }))
    .pipe(uglify())
    .pipe(gulp.dest(directories.output + 'js'))
    .pipe(connect.reload());
});

gulp.task('images', () => {
  return gulp
    .src(directories.images)
    .pipe(imageMin([
      pngquant({quality: [0.5, 0.5]}),
    ], {progressive: true, verbose: true}))
    .pipe(gulp.dest(directories.output + 'img'));
});

gulp.task('sw', () => {
  return gulp
    .src(['./sw.js'])
    .pipe(gulp.dest(directories.output));
});
