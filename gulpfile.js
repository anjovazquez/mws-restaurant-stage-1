var gulp = require('gulp'),
    clean = require('gulp-clean'),
    imagemin = require('gulp-imagemin'),
    image = require('gulp-image'),
    webp = require('gulp-webp'),
    concat = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    gzip = require('gulp-gzip'),
    uglify = require('gulp-uglify-es').default,
    inject = require('gulp-inject'),
    htmlclean = require('gulp-htmlclean'),
    htmlmin = require('gulp-htmlmin'),
    jsmin = require('gulp-jsmin'),
    browserSync = require('browser-sync');

var envs = {
    dev: 'src/',
    dist: 'dist/'
};

var paths = {
    htmlSrc: 'src/*.html',
    swSrc: 'src/sw.js',
    jsSrc: 'src/js/**.js',
    cssSrc: 'src/css/**.css',
    imgSrc: 'src/img/min/**.*',

    manifestSrc: 'src/*.json',
    manifestImg: 'src/images/**',

    dist: 'dist/',
    jsDist: 'dist/js',
    cssDist: 'dist/css',
    imgDist: 'dist/img',

    jsDistFiles: 'dist/js/**.*',
    cssDistFiles: 'dist/css/**.css',

    images: './img/*.jpg'
};

gulp.task('clean', function () {
    return gulp.src(paths.dist)
        .pipe(clean());
});

gulp.task('copy', ['clean'], function () {
    var css = gulp.src(paths.cssDistFiles);
    var js = gulp.src(paths.jsDistFiles);
    gulp.src(paths.jsSrc)
        .pipe(jsmin())
        //.pipe(concat('all.js'))
        //.pipe(uglify())
        //.pipe(gzip())
        .pipe(gulp.dest(paths.jsDist));

    gulp.src(paths.cssSrc)
        .pipe(cleanCSS({ debug: true }, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(gulp.dest(paths.cssDist));

    gulp.src(paths.imgSrc)
        .pipe(gulp.dest(paths.imgDist));

    gulp.src(paths.htmlSrc)
        //.pipe(inject(css, { relative: true }))
        //.pipe(inject(js, { relative: true }))
        .pipe(htmlclean())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(paths.dist));

    gulp.src(paths.swSrc)
        .pipe(jsmin())
        .pipe(gulp.dest(paths.dist));
    gulp.src(paths.manifestSrc)
        .pipe(gulp.dest(paths.dist));
    gulp.src(paths.manifestImg)
        .pipe(gulp.dest(paths.dist+'/images/'));
});

gulp.task('images:compress', function () {
    gulp.src(paths.images)
        .pipe(image())
        .pipe(imagemin())
        .pipe(webp())
        .pipe(gulp.dest('img/min'));
});

gulp.task('serve:dist', ['copy'], (() => {
    browserSync.init({
        server: {
            baseDir: envs.dist,
            //middleware: [compress()]
        }, ui: {
            port: 3000
        }, port: 3000
    });
}));