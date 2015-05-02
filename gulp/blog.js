'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var _ = require('lodash');

var fs = require('fs');
var through = require('through2');
var JSONStream = require('JSONStream');

module.exports = function(options, paths) {

  // for all the blog posts, strip out the front matter and copy remainder of content into markdown files in .tmp
  // take all the frontmatter from the posts, take date and route from post filename, and compile it into one big posts.json file
  gulp.task('blog', function() {

    var postsStream = gulp.src(paths.posts + '/*.md')
      .pipe($.frontMatter())
      // TODO: htmlify after transforming the stream
      // htmlify sans frontmatter
      .pipe($.markdown())
      // copy posts html files
      .pipe(gulp.dest(paths.tmpPosts))
      // check the filename and parse it into the date and route
      .pipe(through.obj(function(file, encoding, callback) {
        var route, date;
        // parse the filename into the route and date
        var filename = file.relative.replace('.html', '').split('_');
        // there should be exactly one underscore between two strings
        if(filename.length === 2) {
          // add the date and route from the filename to the frontmatter
          file.frontMatter.date = filename[0];
          file.frontMatter.route = filename[1];
          // console.log(file.frontMatter);
          this.push(file);
        } else {
          console.warn('Post file ' + file.relative + ' not named correctly.\nFile should be named "[date]_[route].md".\nExample: 20150101_happy-new-year.md');
          this.push(null);
        }
        callback();
      }))

    return gulp.src(paths.src + '/index.js')
      .pipe($.inject(postsStream, {
        starttag: '/* @injectRoutes start */',
        endtag: '/* @injectRoutes end */',
        transform: function(filepath, file) {
          var route = [
            '.state(\'blog/' + file.frontMatter.route + '\', {',
            '  url: \'/blog/' + file.frontMatter.route + '\',',
            '  templateUrl: \'' + 'posts/' + file.relative + '\'',
            // '  controller: function() {',
            // '    var vm = this;',
            // '    vm.mdPath = \'' + 'posts/' + file.relative + '\';',
            // '  },',
            // '  controllerAs: \'vm\'',
            '})'
          ].join('\n');
          return route;
        }
      }))
      .pipe(gulp.dest(paths.src))

    /*return gulp.src(paths.posts + '/*.md')
      .pipe($.frontMatter())
      // copy posts md files sans frontmatter
      .pipe(gulp.dest(paths.tmpPosts))
      // transform the stream to just pull out the frontMatter property on the file object
      .pipe(through.obj(function(file, encoding, callback) {
        var route, date;
        // parse the filename into the route and date
        var filename = file.relative.replace('.md', '').split('_');
        // should be only one underscore between two strings
        if(filename.length === 2) {
          var metadata = {
            date: filename[0],
            route: filename[1],
            filename: file.relative
          };
          // combine the metadata and frontmatter objects into one object
          metadata = _.assign(metadata, file.frontMatter);
          // console.log(metadata);
          this.push(metadata);
        } else {
          console.warn('Post file ' + file.relative + ' not named correctly.\nFile should be named "[date]_[route].md".\nExample: 20150101_happy-new-year.md');
        }
        callback();
      }))*/
      // turn the stream into a json array
      // .pipe(JSONStream.stringify('[\n', ',\n', '\n]\n', 2))
      // .pipe(fs.createWriteStream(paths.tmpPosts + '/posts.json'))

  });

};
