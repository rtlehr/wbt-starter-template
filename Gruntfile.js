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
          { expand: true, cwd: "node_modules/jquery-ui-dist", src: ["images/**"], dest: "dist/assets" },
          // your own images if any
          { expand: true, cwd: "src", src: ["images/**"], dest: "dist/assets" },
          // (optional) static files
          { expand: true, cwd: "static", src: ["**/*"], dest: "dist/static" }
        ]
      }
    },

    concat: {
      js: {
        files: {
          "dist/assets/app.bundle.js": [
            "node_modules/jquery/dist/jquery.min.js",
            "node_modules/jquery-ui-dist/jquery-ui.min.js",
            "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
            "src/app.js",          // TS bundle
            "src/app.extra.js"     // JS bundle
          ]
        }
      },
      css: {
        files: {
          "dist/assets/app.bundle.css": [
            "src/app.css"
          ]
        }
      }
    },

     uglify: {
      prod: {
        files: { "dist/assets/app.bundle.min.js": ["dist/assets/app.bundle.js"] }
      }
    },

     cssmin: {
      prod: {
        options: {
          // ensure relative urls like "images/..." keep working from dist/assets/
          rebase: true,
          rebaseTo: "dist/assets"
        },
        files: { "dist/assets/app.bundle.min.css": ["dist/assets/app.bundle.css"] }
      }
    },

    replace: {
      html: {
        overwrite: true,              // must be at this level
        src: ['dist/index.html'],     // file to modify
        replacements: [
          {
            from: '<!-- inject:css -->',
            to:   '<link rel="stylesheet" href="assets/app.bundle.min.css">'
          },
          {
            from: '<!-- inject:js -->',
            to:   '<script src="assets/app.bundle.min.js"></script>'
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
      open: "http://127.0.0.1:8081/src/index.html"
      // no keepalive here (dev uses watch after connect)
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
      ts:   { files: ["src/ts/**/*.ts"],       tasks: ["exec:ts_build"] },
      js:   { files: ["src/js/**/*.js"],       tasks: ["exec:js_build"] },
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
    // compile app assets first
    "exec:sass_build",
    /* or "postcss" */ "exec:postcss_build",
    "exec:ts_build",
    "exec:js_build",
    // copy base files & assets
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
