import del = require("del");
import * as gulp from "gulp";
const httpServer = require("http-server");
import * as path from "path";
import ts = require("gulp-typescript");

const out = "public";
function outDir(name: string): string { return path.join(out, name); }

gulp.task("clean", () => del(`${out}/*`));

gulp.task("script", ["clean"], () => {
    const tsProject = ts.createProject("assets/script/tsconfig.json", {
        typescript: require("typescript")
    });
    const tsResult = tsProject.src().pipe(ts(tsProject));
    return tsResult.js.pipe(gulp.dest(outDir("script")));
});

function copy(src: string, dest: string): NodeJS.ReadWriteStream {
    return gulp.src(src).pipe(gulp.dest(dest));
}

gulp.task("static", ["clean"], () => copy("assets/static/**", out));
gulp.task("lib", ["clean"], () => copy("node_modules/@(jquery|typeahead.js)/**", outDir("lib")));
gulp.task("index", ["clean"], () => copy("search-index-@(full|head|min).json", out));

gulp.task("build", ["clean", "script", "static", "lib", "index"]);

gulp.task("serve", () => {
    const server = httpServer.createServer({ root: "public" });
    console.log("\nServing to localhost\n");
    server.listen(80);
});

gulp.task("watch", ["build", "serve"], () => gulp.watch("assets/**", ["build"]));

gulp.task("default", ["watch"]);
