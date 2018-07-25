let gulp = require('gulp'),
    sass = require('gulp-sass'),
    cleanCSS = require('gulp-clean-css'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    browserSync = require('browser-sync'),
    gulpBrowser = require("gulp-browser");
var reactify = require('reactify');
var del = require('del');
var size = require('gulp-size');

var reload = browserSync.reload;
var exec = require('child_process').exec;

gulp.task('sass', function () {
    return gulp.src(['app/static/styles/*.scss', 'app/static/styles/**/*.scss'])
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/styles'))
});

gulp.task('minify-js', function () {
    return gulp.src('app/static/scripts/main.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/scripts'));
});

gulp.task('transform', ['del'], function () {
    var stream = gulp.src('app/static/scripts/jsx/*.js')
        .pipe(gulpBrowser.browserify({transform: ['reactify']}))
        .pipe(gulp.dest('app/static/scripts/js/'))
        .pipe(size());
    return stream;
});

gulp.task('del', function () {
    return del(['app/static/scripts/js']);
});

// Default task: Watch Files For Changes & Reload browser
gulp.task('browsersync', function () {
    browserSync.init({
        notify: false,
        proxy: "127.0.0.1:1234"
    });
});

gulp.task('default', function () {
    gulp.start('sass');
    gulp.watch(['app/static/styles/*.scss', 'app/static/styles/**/*.scss'], ['sass']);
    gulp.start('transform');
    gulp.watch('app/static/scripts/jsx/*.js', ['transform']);
});