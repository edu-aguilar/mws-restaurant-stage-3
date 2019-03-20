const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const connect = require('gulp-connect');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const imageMin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const babelify = require('babelify');
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const sourcemaps = require("gulp-sourcemaps");

const directories = {
  css: './src/css/**/*.css',
  js: './src/js/**/*.js',
  html: './src/*.html',
  images: './src/img/**/*.*',
  output: './dist/',
  dependencies: {
    leaflet: './node_modules/leaflet/dist/'
  }
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
    .src([`${directories.dependencies.leaflet}leaflet.css`, directories.css])
    .pipe(autoprefixer({ browsers: ['last 4 versions'] }))
    .pipe(concat('styles.css'))
    .pipe(gulp.dest(directories.output + 'css'))
    .pipe(connect.reload());
});

gulp.task('js', () => {

  const entries = [{
    path: './src/js/main.js',
    buildName: 'main.min.js'
  },
  {
    path: './src/js/restaurant_info.js',
    buildName: 'restaurant_info.min.js'
  }];

  const build = (entry) => {
    return browserify({
      entries: [entry.path]
    })
      .transform(babelify.configure({
        presets: ["@babel/preset-env"]
      }))
      .bundle()
      .pipe(source(entry.buildName))
      .pipe(buffer())
      .pipe(sourcemaps.init())
      //.pipe(uglify())
      .pipe(sourcemaps.write('./maps'))
      .pipe(gulp.dest("./dist/js"));
  }

  return entries.map(build);
})

gulp.task('images', () => {
  return gulp
    .src([directories.images, `${directories.dependencies.leaflet}images/marker-*.*`])
    .pipe(imageMin([
      imageMin.jpegtran({progressive: true}),
      pngquant({ quality: [0.5, 0.5] })
    ], { progressive: true, verbose: true }))
    .pipe(gulp.dest(directories.output + 'img'));
});

gulp.task('sw', () => {
  return gulp
    .src(['./sw.js'])
    .pipe(gulp.dest(directories.output));
});
