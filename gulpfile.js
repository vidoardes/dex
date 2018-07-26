let gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename');

function swallowError (error) {

  // If you want details of the error in the console
  console.log(error.toString())

  this.emit('end')
}

gulp.task('sass', function () {
    return gulp.src(['app/static/styles/*.scss', 'app/static/styles/**/*.scss'])
        .pipe(sass({outputStyle: 'compressed'}))
        .on('error', swallowError)
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/styles'))
});

gulp.task('default', function () {
    gulp.start('sass');
    gulp.watch(['app/static/styles/*.scss', 'app/static/styles/**/*.scss'], ['sass']);
});