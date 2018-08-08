let gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync'),
    webpack = require('webpack-stream')

let reload = browserSync.reload;
let exec = require('child_process').exec;

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

gulp.task('js', function() {
  return gulp.src('app/static/scripts/main.js')
    .pipe(webpack({output: {filename: 'bundle.js'}, mode: 'production' }))
    .pipe(gulp.dest('app/static/'));
})

gulp.task('sass', function () {
    return gulp.src(['app/static/styles/main.scss'])
        .pipe(sass({outputStyle: 'compressed'}))
        .on('error', swallowError)
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/'))
})

gulp.task('default', function () {
    gulp.start('sass')
    gulp.start('js')
    browserSync({notify: false, proxy: "127.0.0.1:5003"})
    gulp.watch(['app/static/styles/**/*.scss'], ['sass'])
    gulp.watch(['app/static/scripts/**/*.js'], ['js'])
    gulp.watch(['app/templates/**/*.*', 'app/static/styles/**/*.js', 'app/static/styles/**/*.scss'], reload)
})