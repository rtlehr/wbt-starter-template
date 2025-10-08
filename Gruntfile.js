module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  const isProd = process.env.NODE_ENV === "production";

  grunt.initConfig({
    clean: { dist: ["dist"] },

    // Run our existing npm scripts via shell
    exec: {
      ts_build: "npm run ts:bundle",
      js_build: "npm run js:bundle",
      sass_build: "npm run sass:build",
      postcss_build: "npm run postcss:build"
    },


    copy: {
      html: {
        files: [{ expand: true, cwd: "src", src: ["index.html"], dest: "dist" }]
      },
      images: {
        files: [
          // jQuery UI icons
          { expand: true, cwd: "node_modules/jquery-ui-dist", src: ["images/**"], dest: "dist/core/images" },
          // your own images if any
          { expand: true, cwd: "src", src: ["core/images/**"], dest: "dist/core/images" },
          // (optional) static files
          { expand: true, cwd: "static", src: ["**/*"], dest: "dist/core/static" } 
        ]
      }
    },

    concat: {
      js: {
        files: {
          "dist/core/js/core.bundle.js": [
            "src/core/js/**/*"
          ],
          "dist/custom/js/custom.bundle.js": [
            "src/custom/js/**/*"
          ]
        }
      },
      css: {
        files: {
          "dist/core/css/core.bundle.css": [
            "src/core/css/**/*"
          ],
          "dist/custom/css/custom.bundle.css": [
            "src/custom/css/**/*"
          ]
          

        }
      }
    },

     uglify: {
      prod: {
        files: { "dist/core/js/core.bundle.min.js": ["dist/core/js/core.bundle.js"] } 
      }
    },

     cssmin: {
      prod: {
        options: {
          // ensure relative urls like "images/..." keep working from dist/core/
          rebase: true,
          rebaseTo: "dist/core/css"
        },
        files: { "dist/core/css/core.bundle.min.css": ["dist/core/css/core.bundle.css"] }
      }
    },

    replace: {
      html: {
        overwrite: true,     
        src: ['dist/index.html'],     // file to modify
        replacements: [
          {
            from: '<!-- inject:css -->',
            to:   '<link rel="stylesheet" href="core/css/core.bundle.min.css"><link rel="stylesheet" href="custom/css/custom.bundle.min.css">'
          },
          {
            from: '<!-- inject:js -->',
            to:   '<script src="core/js/core.bundle.min.js"></script><script src="custom/js/custom.bundle.min.js"></script>'
          },
          {
            from: /<!-- dev:css:start -->[\s\S]*?<!-- dev:css:end -->/g,
            to: ''
          },
          {
            from: /<!-- dev:js:start -->[\s\S]*?<!-- dev:js:end -->/g,
            to: ''
          }
        ]
      }
    },


    // Serve the project root so ../node_modules in src/index.html keeps working
    connect: {
      server: {
        options: {
          port: 8081,
          base: ".",
          hostname: "127.0.0.1",
          open: "http://127.0.0.1:8081/src/index.html",
          livereload: 35729
        }
      },
      // ✅ NEW: prod preview server
      prod: {
        options: {
          port: 8082,
          base: "dist",
          hostname: "127.0.0.1",
          open: "http://127.0.0.1:8082/",
          keepalive: true
        }
      }
    },

    watch: {
      options: {
        livereload: true // ✅ triggers refresh
      },
      ts:   { files: ["src/development/core/ts/**/*.ts"],       tasks: ["exec:ts_build"] },
      js:   { files: ["src/development/core/js/**/*.js"],       tasks: ["exec:js_build"] },
      scss: { files: ["src/styles/**/*.scss"], tasks: ["exec:sass_build", "exec:postcss_build"] },
      html: { files: ["src/**/*.html"] }
    }
  });

  grunt.registerTask("build", ["exec:sass_build", "exec:postcss_build", "exec:ts_build"]);
  grunt.registerTask("serve", ["connect:server"]);
  grunt.registerTask("dev", ["build", "connect:server", "watch"]);
  grunt.registerTask("preview", ["prod", "connect:prod"]);

  grunt.registerTask("prod", [
    "clean:dist",
    // compile app core first
    "exec:sass_build",
    /* or "postcss" */ "exec:postcss_build",
    "exec:ts_build",
    "exec:js_build",
    // copy base files & core
    "copy:html",
    "copy:images",
    // make bundles
    "concat:js",
    "concat:css",
    // minify
    "uglify:prod",
    "cssmin:prod",
    // rewrite dist/index.html to use the minified bundles
    "replace:html"
  ]);
  
};
