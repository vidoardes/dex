"use strict";

// Load plugins
const gulp = require("gulp");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const browsersync = require("browser-sync");
const webpack = require("webpack-stream");
const zip = require("gulp-zip");
const del = require("del");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");

function swallowError(error) {
    console.log(error.toString());
    this.emit("end")
}

// BrowserSync
function browserSync(done) {
    browsersync.init({
        notify: false,
        proxy: "127.0.0.1:5003",
        port: 3000
    });
    done();
}

// BrowserSync reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
}

// Compile CSS
function css() {
    return gulp
        .src(["app/static/styles/main.scss"])
        .pipe(sass({outputStyle: "expanded"}))
        .on("error", swallowError)
        .pipe(gulp.dest("app/static/")).pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(gulp.dest("app/static/"))
        .pipe(browsersync.stream());
}

// Compile JS
function js() {
    return gulp
        .src(["app/static/scripts/main.js"])
        .pipe(webpack({output: {filename: "bundle.js"}, mode: "production"}))
        .on("error", swallowError)
        .pipe(gulp.dest("app/static/"))
        .pipe(browsersync.stream());
}

function clean() {
    return del("dist");
}

function build() {
    gulp
        .src("prod.env")
        .pipe(rename(".env"))
        .pipe(gulp.dest("dist"));
    gulp
        .src(["*.py"])
        .pipe(gulp.dest("dist"));
    gulp
        .src(["requirements.txt"])
        .pipe(gulp.dest("dist"));
    gulp
        .src(".deploy-config/*", { dot: true })
        .pipe(gulp.dest("dist/"));
    gulp
        .src(["app/**/*.py", "app/**/*.html", "app/**/*.txt"])
        .pipe(gulp.dest("dist/app"));
    gulp
        .src(["app/static/*.css", "app/static/*.js", "app/static/*.json"])
        .pipe(gulp.dest("dist/app/static"));
    gulp
        .src(["app/static/docs/**/*.pdf"])
        .pipe(gulp.dest("dist/app/static/docs"));
    return gulp
        .src(["app/static/img/**/*.*"])
        .pipe(gulp.dest("dist/app/static/img/"));
}

// Watch files
function watchFiles() {
  gulp.watch("app/static/styles/**/*", css);
  gulp.watch("app/static/scripts/**/*", js);
  gulp.watch("./app/templates/**/*", gulp.series(browserSyncReload));
}

const dist = gulp.series(css, clean, js, build);
const watch = gulp.parallel(watchFiles, browserSync);

exports.build = dist;
exports.default = watch;