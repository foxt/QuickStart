console.log("Loading imports...")
const pty = require('node-pty')
const childProcess = require('child_process')
const input = require("input")
const chalk = require("chalk")
const fs = require("fs")


console.log("Declaring funtions...")
function spawnProcess(shell,options) {
    console.log("Spawning shell...")
    var ptyProcess = pty.spawn(shell,options, {
        name: process.env.TERM, // fix colours
        cols: process.stdout.columns, // fix sizing
        rows: process.stdout.rows, // ditto
        cwd: process.env.HOME, // sets home
        env: process.env // sets env variables
    });

    console.log("Going raw...")
    process.stdin.setRawMode(true); // fixes some things with resizing, ctrl+c

    console.log("Piping...")
    ptyProcess.pipe(process.stdout) // pipe process output to terminal
    process.stdin.pipe(ptyProcess) // pipe terminal input to process

    ptyProcess.on("end",async function() {
        process.stdin.unpipe() // prevents node from quitting on keypress
        process.stdin.setRawMode(false); // aparently fixes things

        var c = await input.select(`${shell} has exited, what would you like to do?`, [
            "Restart it",
            "Choose another shell",
            "Exit"
        ])
        if (c == "Restart it") {
            spawnProcess(shell,options)
        } else if (c == "Choose another shell") {
            main()
        }
    })
    console.clear()
}

async function main() {
    console.log("Loading config...")
    var config = {
        startcommands: [],
        greeting: chalk.grey("Welcome to QuickStart. https://github.com/thelmgn/quickstart. ") + chalk.inverse("No config is set, falling back!"),
        shells: [
            {
                name: chalk.green(process.env.SHELL),
                shell: process.env.SHELL,
                args: []
            },
            {
                name: chalk.grey("Seperator!")
            },
            {
                name: chalk.green("Node shell"),
                shell: "node",
                args: []
            }
        ]
    }
    global.chalk = chalk
    try {
        eval(fs.readFileSync("./quickstart-conf.js").toString())
        config = global.fileConfig
    } catch(e) {
        console.error(e)
        process.exit(-1)
    }
    welcometexts = [config.greeting]
    for (var cmd of config.startcommands) {
        console.log("Waiting on " + cmd)
        welcometexts.push(childProcess.spawnSync(cmd).stdout.toString())
    }
    console.log("Processing shells...")
    var opts = []
    for (var shell of config.shells) {
        opts.push({
            name: shell.name,
            value: [shell.shell,shell.args],
            disabled: !shell.shell
        })
    }
    console.clear()
    console.log("Loading completed in " + process.uptime() * 1000 + "ms")
    console.log(welcometexts.join("\n"))
    var shell = await input.select("Choose a shell", opts)
    spawnProcess(...shell)
}
main()
