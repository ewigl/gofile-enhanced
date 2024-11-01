import fs from 'fs'
import http from 'http'
import path from 'path'

const PORT = 50000

const USER_SCRIPT_FILE_NAME = 'gofile.user.js'

const MIME_TYPES = {
    default: 'text/plain',
    js: 'application/javascript',
}

const STATIC_PATH = path.join(process.cwd(), '.')

const toBool = [() => true, () => false]

const prepareFile = async (url) => {
    const paths = [STATIC_PATH, url]

    if (url.endsWith('/')) paths.push('index.html')

    const filePath = path.join(...paths)
    const pathTraversal = !filePath.startsWith(STATIC_PATH)
    const exists = await fs.promises.access(filePath).then(...toBool)
    const found = !pathTraversal && exists
    const streamPath = found ? filePath : STATIC_PATH + '/404.html'
    const ext = path.extname(streamPath).substring(1).toLowerCase()
    const stream = fs.createReadStream(streamPath)

    return { found, ext, stream }
}

http.createServer(async (req, res) => {
    const file = await prepareFile(req.url)
    const statusCode = file.found ? 200 : 404
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default

    res.writeHead(statusCode, { 'Content-Type': mimeType })

    file.stream.pipe(res)

    console.log(`${req.method} ${req.url} ${statusCode}`)
    console.log(`userscript at http://localhost:${PORT}/${USER_SCRIPT_FILE_NAME}`)
}).listen(PORT)

console.log(`userscript at http://localhost:${PORT}/${USER_SCRIPT_FILE_NAME}`)
