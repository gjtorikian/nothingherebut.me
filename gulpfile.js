var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-ruby-sass');
var livereload = require('gulp-livereload');
var gap = require('gulp-append-prepend');
var cleanCSS = require('gulp-clean-css');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

var IS_PRODUCTION = process.env.NODE_ENV == "production";

gulp.task('styles', function() {
  return sass('assets/styles/*.scss', { style: 'expanded' })
    .pipe(gap.prependFile('assets/styles/milligram.css'))
    .pipe(gap.prependFile('assets/styles/normalize.css'))
    .pipe(gulpif(IS_PRODUCTION, cleanCSS()))
    .pipe(gulp.dest('public/assets/css'))
    .pipe(livereload());
});

gulp.task('scripts', function() {
  return gulp.src('assets/scripts/*.js')
    .pipe(gulpif(IS_PRODUCTION, uglify()))
    .pipe(gulp.dest('public/assets/javascripts'))
    .pipe(livereload());
});

gulp.task('pug',function(){
  return gulp.src('views/*.pug')
  .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('assets/styles/*', ['styles']);
  gulp.watch('assets/scripts/*.js', ['scripts']);
  gulp.watch('text.yml', ['server']);
  gulp.watch('views/*.pug', ['pug']);
});

gulp.task('server',function(){
  nodemon();
});

gulp.task('compile', ['styles', 'scripts']);
gulp.task('serve', ['compile', 'server', 'watch']);
