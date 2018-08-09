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
    compress = require('compression'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync');

var envs = {
    dev: 'src/',
    dist: 'dist/'
};

var paths = {
    htmlSrc: 'src/*.html',
    htmlMainSrc: 'src/index.html',
    htmlRestSrc: 'src/restaurant.html',
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

    jsDistMainFiles: 'dist/js/main*.js',
    jsDistRestFiles: 'dist/js/rest*.js',
    cssDistFiles: 'dist/css/**.css',

    images: 'src/img/*.{jpg,png}',
    restjs: ['src/js/load_sw.js', 'src/js/dbhelper.js', 'src/js/restaurant_info.js'], //'src/js/idb.js',
    mainjs: ['src/js/load_sw.js', 'src/js/dbhelper.js', 'src/js/main.js'], //'src/js/idb.js',    
    idbjs: 'src/js/idb.js',
    restjsdist: ['dist/js/idb.js', 'dist/js/load_sw.js', 'dist/js/dbhelper.js', 'dist/js/restaurant_info.js'],
    mainjsdist: ['dist/js/idb.js', 'dist/js/load_sw.js', 'dist/js/dbhelper.js', 'dist/js/main.js']
};

gulp.task('clean', function () {
    return gulp.src(paths.dist)
        .pipe(clean());
});

gulp.task('sw', ['clean'], function () {
    gulp.src(paths.swSrc)
        .pipe(jsmin())
        .pipe(gulp.dest(paths.dist));
});

gulp.task('manifest', ['clean'], function () {
    gulp.src(paths.manifestSrc)
        .pipe(gulp.dest(paths.dist));
    gulp.src(paths.manifestImg)
        .pipe(gulp.dest(paths.dist + '/images/'));
});

gulp.task('sass', ['clean'], function () {
    return gulp.src('src/css/**.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest(paths.cssDist));
  });

gulp.task('css', ['clean', 'sass'], function () {
    return gulp.src(paths.cssSrc)
        .pipe(cleanCSS({ debug: true }, (details) => {
            console.log(`${details.name}: ${details.stats.originalSize}`);
            console.log(`${details.name}: ${details.stats.minifiedSize}`);
        }))
        .pipe(gzip())
        .pipe(gulp.dest(paths.cssDist));
});

gulp.task('js_main', ['clean'], function () {
    return gulp.src(paths.mainjs)
        .pipe(concat('main.js'))
        .pipe(jsmin())
        .pipe(uglify())
        .pipe(gzip())
        .pipe(gulp.dest(paths.jsDist));
});

gulp.task('js_rest', ['clean'], function () {
    return gulp.src(paths.restjs)
        .pipe(concat('rest.js'))
        .pipe(jsmin())
        .pipe(uglify())
        .pipe(gzip())
        .pipe(gulp.dest(paths.jsDist));
});

gulp.task('js_idb', ['clean'], function () {
    return gulp.src(paths.idbjs)
        .pipe(jsmin())
        .pipe(uglify())
        .pipe(gzip())
        .pipe(gulp.dest(paths.jsDist));
});

gulp.task('images', ['clean'], function () {
    gulp.src(paths.imgSrc)
        .pipe(gulp.dest(paths.imgDist));
});

gulp.task('html_main', ['js_idb', 'js_main', 'css'], function () {
    var css = gulp.src(paths.cssDistFiles);
    var js = gulp.src(paths.jsDistMainFiles);
    gulp.src(paths.htmlMainSrc)
        .pipe(inject(css, { ignorePath: 'dist' }))
        .pipe(inject(js, { ignorePath: 'dist' }))
        .pipe(htmlclean())
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('html_rest', ['js_idb', 'js_rest', 'css'], function () {
    var css = gulp.src(paths.cssDistFiles);
    var js = gulp.src(paths.jsDistRestFiles);
    gulp.src(paths.htmlRestSrc)
        .pipe(inject(css, { ignorePath: 'dist' }))
        .pipe(inject(js, { ignorePath: 'dist' }))
        .pipe(htmlclean())
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.dist));
});


gulp.task('html_main_no_min', ['js_main', 'css'], function () {
    var css = gulp.src(paths.cssDistFiles);
    var js = gulp.src(paths.mainjsdist);
    gulp.src(paths.htmlMainSrc)
        .pipe(inject(css, { ignorePath: 'dist' }))
        .pipe(inject(js, { ignorePath: 'dist' }))
        //.pipe(htmlclean())
        //.pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('html_rest_no_min', ['js_rest', 'css'], function () {
    var css = gulp.src(paths.cssDistFiles);
    var js = gulp.src(paths.restjsdist);
    gulp.src(paths.htmlRestSrc)
        .pipe(inject(css, { ignorePath: 'dist' }))
        .pipe(inject(js, { ignorePath: 'dist' }))
        //.pipe(htmlclean())
        //.pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(paths.dist));
});

gulp.task('images:compress', function () {
    return gulp.src(paths.images)
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(webp())
        .pipe(gulp.dest('src/img/min'));
});

gulp.task('serve:dist_no_min', ['sw', 'manifest', 'images', 'html_rest_no_min', 'html_main_no_min'], (() => {
    browserSync.init({
        server: {
            baseDir: envs.dist,
        }, ui: {
            port: 3000
        }, port: 3000
    });
}));

gulp.task('serve:dist', ['sw', 'manifest', 'images', 'html_rest', 'html_main'], (() => {
    browserSync.init({
        server: {
            baseDir: envs.dist,
            /* middleware: [compress(),
                 function (req, res, next) {
                     console.log(req);
                 }
             ]*/
            middleware: function (req, res, next) {
                var gzip = compress();

                if (req._parsedUrl.pathname.endsWith(".css.gz")) {
                    res.setHeader('Content-Type', 'text/css');
                    res.setHeader('Content-Encoding', 'gzip');
                    console.log(req._parsedUrl.pathname);
                    //gzip(req, res, next);
                }
                else {
                    if (req._parsedUrl.pathname.endsWith("gz")) {
                        res.setHeader('Content-Encoding', 'gzip');

                        //gzip(req, res, next);
                    }
                    else {
                    }
                }

                next();
            }
        }, ui: {
            port: 3000
        }, port: 3000
    });
}));