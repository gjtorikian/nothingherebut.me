var gulp = require('gulp');
var exec = require('child_process').exec;
var livereload = require('gulp-livereload');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var execSync = require('child_process').execSync;

var IS_PRODUCTION = process.env.NODE_ENV == "production";

gulp.task('rebuild_texts',function(){
  execSync("node validate.js");
});

gulp.task('validate',function(){
  livereload.listen();
  gulp.watch('validate.js', ['rebuild_texts']);
  gulp.watch('text.yml', ['rebuild_texts']);
});

gulp.task('javascripts', function() {
  return gulp.src('assets/javascripts/*.js')
    .pipe(gulpif(IS_PRODUCTION, uglify()))
    .pipe(gulp.dest('public/assets/javascripts'))
    .pipe(livereload());
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('assets/javascripts/*.js', gulp.series('javascripts'));
});

gulp.task('server', function (cb) {
  exec('node server', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('compile', gulp.series('javascripts'));
gulp.task('serve', gulp.parallel(['compile', 'server', 'watch']));
