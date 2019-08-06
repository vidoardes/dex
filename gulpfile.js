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

// Build AWS ZIP
function build() {
    del("dist");

    gulp
        .src("prod.env")
        .pipe(rename(".env"))
        .pipe(gulp.dest("tmp"));
    gulp
        .src(["*.py"])
        .pipe(gulp.dest("tmp"));
    gulp
        .src(["requirements.txt"])
        .pipe(gulp.dest("tmp"));
    gulp
        .src([".ebextensions/*"])
        .pipe(gulp.dest("tmp/.ebextensions"));
    gulp
        .src(["app/**/*.py", "app/**/*.html", "app/**/*.txt"])
        .pipe(gulp.dest("tmp/app"));
    gulp
        .src(["app/static/*.css", "app/static/*.js", "app/static/*.json"])
        .pipe(gulp.dest("tmp/app/static"));
    gulp
        .src(["app/static/docs/**/*.pdf"])
        .pipe(gulp.dest("tmp/app/static/docs"));

    return gulp
        .src(["app/static/img/**/*.*"])
        .pipe(gulp.dest("tmp/app/static/img/"));
}

function clean() {
    return del("tmp");
}

function archive() {
    return gulp
        .src("tmp/**/*.*", {dot: true})
        .pipe(zip("dex-elb.zip"))
        .pipe(gulp.dest("dist"));
}

// Watch files
function watchFiles() {
  gulp.watch("app/static/styles/**/*", css);
  gulp.watch("app/static/scripts/**/*", js);
  gulp.watch("./app/templates/**/*", gulp.series(browserSyncReload));
}

const awsbuild = gulp.series(css, js, build, archive, clean);
const watch = gulp.parallel(watchFiles, browserSync);

exports.awsbuild = awsbuild;
exports.default = watch;