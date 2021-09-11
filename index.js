
const config = require("./startup")

const cheerio = require("cheerio")
const fetch = require("node-fetch")
const iconv = require("iconv-lite")
const { ensureDirSync, existsSync, rmdirSync, writeFileSync } = require("fs-extra")

const compareFn = (s1, s2) => s2.students.registered - s1.students.registered

async function parseSubjectsList(semester = 1) {
    const url = `http://desk.nuwm.edu.ua/cgi-bin/classman.cgi?n=40&sesID=${ config.sessionId }&half=${ semester }`
    const res = await fetch(url).then(r => r.buffer())
    const page = iconv.decode(res, "win1251")

    const $ = cheerio.load(page), subjects = []
    const [, ...table] = Array.from($(".table > tbody > tr"))

    for (const subject of table) {
        const subjInfo = $($(subject).find("td")[2])[0]

        const title = subjInfo.children[0].data
        const teacher = $($(subject).find("td")[6]).text()
        const required = Number($(subjInfo.children[2]).text().split(" - ")[1])
        const registered = Number($(subjInfo.children[4]).find("em > strong").text())

        subjects.push({ title, teacher, students: { required, registered } })
    }

    console.log(`\nСеместр ${ semester }`)

    if (subjects.length == 0) {
        return console.log("Предметів не знайдено")
    }

    writeUnified(subjects.sort(compareFn), semester, "all")
    console.log(`Всього ${ subjects.length } предметів`)

    const used = subjects
        .filter(s => s.students.registered > 0)
        .sort(compareFn)
    writeUnified(used, semester, "min1")
    console.log(`* З них ${ used.length } мають як мінімум одного студента`)

    const guaranteed = subjects
        .filter(s => s.students.registered >= s.students.required)
        .sort(compareFn)
    writeUnified(guaranteed, semester, "guaranteed")
    console.log(`* З них ${ guaranteed.length } гарантовано будуть проводитися`)

    const withVerTeachers = subjects
        .filter(s => config.verifiedTeachers.includes(s.teacher.split(" ")[0]))
        .sort(compareFn)
    writeUnified(withVerTeachers, semester, "verified")
    console.log(`* З них ${ withVerTeachers.length } у перевірених викладачів`)

    const guarAndTeachers = guaranteed
        .filter(s => config.verifiedTeachers.includes(s.teacher.split(" ")[0]))
        .sort(compareFn)
    writeUnified(guarAndTeachers, semester, "guaranteed_verified")
    console.log(`* З них ${ guarAndTeachers.length } гарантовані + перевірені викладачі`)
}

async function run() {
    if (existsSync("data")) {
        rmdirSync("data", { recursive: true })
    }

    if (config.parallel) {
        await Promise.all([
            parseSubjectsList(1),
            parseSubjectsList(2)
        ]).catch(console.error)
    }
    else {
        await parseSubjectsList(1)
        await parseSubjectsList(2)
    }
    
    console.log("\nРозгорнутий список предметів дивитися в папці \"data\"")
}

run().catch(console.error)

function getFilePath(semester = 1, type = "all", ext = "json") {
    let baseDir = "data/"
    switch (ext) {
        case "json":
            baseDir += "json"
            break
        case "txt":
            baseDir += "prettified"
            break
        default:
            throw new Error("Unknown extension")
    }

    const path = `${baseDir}/${semester}`
    ensureDirSync(path)
    return path + `/subjects_${type}.${ext}`
}

function writeUnified(array, semester, type) {
    writeJSON(getFilePath(semester, type, "json"), array)
    writePrettified(getFilePath(semester, type, "txt"), array)
}

function writeJSON(path, array) {
    writeFileSync(path, JSON.stringify(array, null, "\t"))
}

const subjFormatter = s =>
`${s.title}
Викладач: ${s.teacher}
Мінімум ${s.students.required}, зареєстровано ${s.students.registered}`

function writePrettified(path, array) {
    const text = array.map(subjFormatter).join("\n\n")
    writeFileSync(path, text)
}
