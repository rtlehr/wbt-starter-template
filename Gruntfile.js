// Gruntfile.js
module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  const isProd = process.env.NODE_ENV === "production";

  grunt.initConfig({
    clean: {
      dist: ["dist"],
      dev: ["src/core/css","src/core/js", "src/custom/css", "src/custom/js"] // clear generated assets + intermediates
    },

    // Run npm scripts
    exec: {
      sass_build: "npm run sass:build",      // scss → src/core/css & src/custom/css
      postcss_build: "npm run postcss:build" // autoprefix src/core/css/core.css
    },

    copy: {
      html: { files: [{ expand: true, cwd: "src", src: ["index.html"], dest: "dist" }] },
      images: {
        files: [
          { expand: true, cwd: "node_modules/jquery-ui-dist", src: ["images/**"], dest: "dist/core/images" },
          { expand: true, cwd: "src", src: ["core/images/**"], dest: "dist/core/images" },
          { expand: true, cwd: "src", src: ["custom/images/**"], dest: "dist/custom/images" },
          { expand: true, cwd: "static", src: ["**/*"], dest: "dist/core/static" }
        ]
      },
      data: {
        files: [
          { expand: true, cwd: "src/core/data",   src: ["**/*.json"], dest: "dist/core/data" },
          { expand: true, cwd: "src/custom/data", src: ["**/*.json"], dest: "dist/custom/data" }
        ]
      },
      cssToProd: {
        files: [
          { expand: true, cwd: "src/core/css",   src: ["**/*.css"], dest: "dist/core/css" },
          { expand: true, cwd: "src/custom/css", src: ["**/*.css"], dest: "dist/custom/css" }
        ]
      },
      content: {
        files: [
          { expand: true, cwd: "src",   src: ["content/**"], dest: "dist" }
        ]
      }
    },

    /**
     * DEV concat: assemble preview files (not watched) from quarantined bundle + custom JS
     */
    concat: {
      dev: {
        files: {
          "src/core/js/core.js": [
            "src/development/core/js/**/*.js" // esbuild output
          ],
          "src/custom/js/custom.js": [
            "src/development/custom/js/**/*.js"
          ]
        }
      },

      /**
       * PROD concat: ship the same bundle + custom JS into dist
       */
      prod: {
        files: {
          "dist/core/js/core.js": [
            "src/development/core/js/**/*.js"
          ],
          "dist/custom/js/custom.js": [
            "src/development/custom/js/**/*.js"
          ]
        }
      }
    },

    uglify: {
      prod: {
        files: {
          "dist/core/js/core.min.js": ["dist/core/js/core.js"],
          "dist/custom/js/custom.min.js": ["dist/custom/js/custom.js"]
        }
      }
    },

    cssmin: {
      prod: {
        options: { rebase: true, rebaseTo: "dist/core/css" },
        files: {
          "dist/core/css/core.min.css": ["dist/core/css/core.css"],
          "dist/custom/css/custom.min.css": ["dist/custom/css/custom.css"]
        }
      }
    },

    replace: {
      html: {
        overwrite: true,
        src: ["dist/index.html"],
        replacements: [
          { from: "<!-- inject:css -->", to: '<link rel="stylesheet" href="core/css/core.min.css">\n\n<link rel="stylesheet" href="custom/css/custom.min.css">' },
          { from: "<!-- inject:js -->",  to: '<script src="core/js/core.min.js"></script>\n\n<script src="custom/js/custom.min.js"></script>' },
          { from: /<!-- dev:css:start -->[\s\S]*?<!-- dev:css:end -->/g, to: "" },
          { from: /<!-- dev:js:start -->[\s\S]*?<!-- dev:js:end -->/g, to: "" }
        ]
      }
    },

    // Dev servers
    connect: {
      server: {
        options: {
          port: 8081,
          base: ".",
          hostname: "127.0.0.1",
          open: "http://127.0.0.1:8081/src/index.html"
        }
      },
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

    /**
     * WATCH only authoring sources (never watch build/, src/core/, src/custom/, or dist/)
     */
    watch: {
      options: { debounceDelay: 300 },
      js: {
        files: ["src/development/core/js/**/*.js", "src/development/custom/js/**/*.js"],
        tasks: ["concat:dev"]
      },
      scss: {
        files: [
          "src/development/core/css/**/*.scss",
          "src/development/custom/css/**/*.scss"
        ],
        tasks: ["exec:sass_build", "exec:postcss_build"]
      },
      html: { files: ["src/**/*.html"] }
    }
  });

  // Pipelines
  grunt.registerTask("build", [
    "exec:sass_build",
    "exec:postcss_build"
  ]);

  grunt.registerTask("dev", [
    "clean:dev",
    "build",
    "concat:dev",
    "connect:server",
    "watch"
  ]);

  grunt.registerTask("serve", ["connect:server"]);

  grunt.registerTask("prod", [
    "clean:dist",
    "exec:sass_build",
    "exec:postcss_build",
    "concat:prod",
    "copy:html",
    "copy:images",
    "copy:content",
    "copy:data",
    "copy:cssToProd",
    "uglify:prod",
    "cssmin:prod",
    "replace:html"
  ]);

  grunt.registerTask("preview", ["prod", "connect:prod"]);
};
