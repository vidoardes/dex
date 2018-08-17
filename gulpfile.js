const gulp = require("gulp"),
    sass = require("gulp-sass"),
    rename = require("gulp-rename"),
    browserSync = require("browser-sync"),
    webpack = require("webpack-stream"),
    zip = require("gulp-zip"),
    clean = require("gulp-clean"),
    runSequence = require("run-sequence")

let reload = browserSync.reload
let exec = require("child_process").exec

function swallowError(error) {
    console.log(error.toString())
    this.emit("end")
}

gulp.task("js", function () {
    return gulp.src("app/static/scripts/main.js")
        .pipe(webpack({output: {filename: "bundle.js"}, mode: "production"}))
        .on("error", swallowError)
        .pipe(gulp.dest("app/static/"))
})

gulp.task("sass", function () {
    return gulp.src("app/static/styles/main.scss")
        .pipe(sass({outputStyle: "compressed"}))
        .on("error", swallowError)
        .pipe(gulp.dest("app/static/"))
})

gulp.task("clean:tmp", function () {
    return gulp.src(["tmp"], {read: false}).pipe(clean())
})

gulp.task("compile", ["clean:tmp"], function () {
    gulp.src(["dist"], {read: false}).pipe(clean())
    gulp.src("prod.env").pipe(rename(".env")).pipe(gulp.dest("tmp"))
    gulp.src(["*.py"]).pipe(gulp.dest("tmp"))
    gulp.src(["requirements.txt"]).pipe(gulp.dest("tmp"))
    gulp.src([".ebextensions/*"]).pipe(gulp.dest("tmp/.ebextensions"))
    gulp.src(["app/**/*.py", "app/**/*.html", "app/**/*.txt"]).pipe(gulp.dest("tmp/app"))
    gulp.src(["app/static/*.css", "app/static/*.js"]).pipe(gulp.dest("tmp/app/static"))
    gulp.src(["app/static/docs/**/*.pdf"]).pipe(gulp.dest("tmp/app/static/docs"))
    return gulp.src(["app/static/img/**/*.*"]).pipe(gulp.dest("tmp/app/static/img/"))
})

gulp.task('archive', ["compile"], function () {
    return gulp.src("tmp/**/*.*", {dot: true})
        .pipe(zip("dex-elb.zip"))
        .pipe(gulp.dest("dist"))
})

gulp.task("default", function () {
    gulp.start("sass")
    gulp.start("js")
    browserSync({notify: false, proxy: "127.0.0.1:5003"})
    gulp.watch(["app/static/styles/**/*.scss"], ["sass"])
    gulp.watch(["app/static/scripts/**/*.js"], ["js"])
    gulp.watch(["app/templates/**/*.*", "app/static/styles/**/*.js", "app/static/styles/**/*.scss"], reload)
})

gulp.task("build", function (callback) {
    runSequence(
        ["sass", "js"],
        "archive",
        "clean:tmp",
        callback
    )
})