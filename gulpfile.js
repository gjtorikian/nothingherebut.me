var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');

var IS_PRODUCTION = process.env.NODE_ENV == "production";

gulp.task('javascripts', function() {
  return gulp.src('assets/javascripts/*.js')
    .pipe(gulpif(IS_PRODUCTION, uglify()))
    .pipe(gulp.dest('public/assets/javascripts'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('assets/javascripts/*.js', ['javascripts']);
  gulp.watch('text.yml', ['server']);
  gulp.watch('views/*.html', ['server']);
});

gulp.task('server',function(){
  nodemon();
});

gulp.task('compile', ['javascripts']);
gulp.task('serve', ['compile', 'server', 'watch']);
