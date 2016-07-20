/// <reference path="./declarations.d.ts"/>

import {execSync} from "child_process";
import del = require("del");
import * as fse from "fs-extra";
import * as gulp from "gulp";
import {createServer} from "http-server";
import merge = require("merge-stream");
import * as path from "path";
import * as tmp from "tmp";
import ts = require("gulp-typescript");

const out = "public";
function outDir(name: string): string { return path.join(out, name); }

gulp.task("clean", () => del(`${out}/*`));

gulp.task("script", ["clean"], () => {
    const tsProject = ts.createProject("assets/script/tsconfig.json", {
        typescript: require("typescript")
    });
    return tsProject.src().pipe(ts(tsProject)).js.pipe(gulp.dest(outDir("script")));
});

function copy(src: string, dest: string): NodeJS.ReadWriteStream {
    return gulp.src(src).pipe(gulp.dest(dest));
}

gulp.task("static", ["clean"], () => copy("assets/static/**", out));
gulp.task("lib", ["clean"], () =>
    merge(...["jquery/dist/jquery.min.js", "typeahead.js/dist/typeahead.bundle.min.js"].map(src =>
        copy(`node_modules/${src}`, outDir("lib")))));

gulp.task("build", ["clean", "script", "static", "lib"]);

gulp.task("serve", () => {
    const server = createServer({ root: "public" });
    console.log("\nServing to localhost\n");
    server.listen(80);
});

gulp.task("watch", ["build", "serve"], () => gulp.watch("assets/**", ["build"]));

gulp.task("default", ["watch"]);

gulp.task("publish", ["build"], async () => {
    function exec(cmd: string): string {
        return execSync(cmd, { encoding: "utf8" });
    }

    if (!(exec("git status").includes("nothing to commit"))) {
        throw new Error("Commit all changes first!")
    }

    if (exec("git rev-parse --abbrev-ref HEAD").trim() !== "master") {
        throw new Error("You are not on master branch.");
    }

    const tmpObj = tmp.dirSync();
    console.log(`Temporaries are stored at ${tmpObj.name}`);
    function tmpDir(dir: string): string {
        return path.join(tmpObj.name, dir);
    }

    const toMove = ["node_modules", "public"];
    // Move files away temporarily.
    await Promise.all(toMove.map(dir => mvPromise(dir, tmpDir(dir))));

    exec("git checkout gh-pages");
    // Clean out the old
    const oldFiles = fse.readdirSync(".").filter(f => f !== ".git");
    oldFiles.forEach(fse.removeSync);
    // Move in the new
    fse.copySync(tmpDir("public"), ".");

    // And commit it
    exec("git add --all");
    exec("git commit -m \"Update from master\"");
    exec("git push");

    exec("git checkout master");
    // Move files back.
    await Promise.all(toMove.map(dir => mvPromise(tmpDir(dir), dir)));
});

declare module "fs-extra" {
    function move(src: string, dest: string, cb: (err: Error | undefined) => void): void;
}

function mvPromise(src: string, dest: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fse.move(src, dest, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        })
    });
}
