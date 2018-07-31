let gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync');

var reload = browserSync.reload;
var exec = require('child_process').exec;

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

gulp.task('sass', function () {
    return gulp.src(['app/static/styles/main.scss'])
        .pipe(sass({outputStyle: 'compressed'}))
        .on('error', swallowError)
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/'))
});

gulp.task('default', function () {
    gulp.start('sass');
    browserSync({notify: false, proxy: "127.0.0.1:5003"});
    gulp.watch(['app/static/styles/*.scss', 'app/static/styles/**/*.scss'], ['sass']);
    gulp.watch(['templates/**/*.*', 'app/static/styles/*.scss', 'app/static/styles/**/*.scss'], reload);
});