var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

var IS_PRODUCTION = process.env.NODE_ENV == "production";

gulp.task('scripts', function() {
  return gulp.src('assets/scripts/*.js')
    .pipe(gulpif(IS_PRODUCTION, uglify()))
    .pipe(gulp.dest('public/assets/javascripts'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('assets/scripts/*.js', ['scripts']);
  gulp.watch('text.yml', ['server']);
  gulp.watch('views/*.html', ['server']);
});

gulp.task('server',function(){
  nodemon();
});

gulp.task('compile', ['scripts']);
gulp.task('serve', ['compile', 'server', 'watch']);
