import { type NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.mts', '.wmv',
])

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder')?.trim()

  if (!folder) {
    return NextResponse.json({ error: 'Missing ?folder= parameter' }, { status: 400 })
  }

  // Resolve to an absolute path and guard against directory traversal
  const resolved = path.resolve(folder)

  let entries: fs.Dirent[]
  try {
    entries = await fs.readdir(resolved, { withFileTypes: true })
  } catch {
    return NextResponse.json(
      { error: `Cannot read folder: ${resolved}. Check the path exists and is accessible.` },
      { status: 422 },
    )
  }

  // Collect video files with their stats
  const fileResults = await Promise.all(
    entries
      .filter((e) => e.isFile() && VIDEO_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map(async (e) => {
        const filePath = path.join(resolved, e.name)
        let size = 0
        try {
          const stat = await fs.stat(filePath)
          size = stat.size
        } catch { /* ignore stat errors */ }
        return { name: e.name, path: filePath, size }
      }),
  )

  // Sort alphabetically by filename
  fileResults.sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({ files: fileResults, folder: resolved })
}
