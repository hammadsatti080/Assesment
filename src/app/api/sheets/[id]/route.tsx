
import { NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

// export const runtime = 'nodejs';

type Context = {
  params: Promise<{ id: string }>;
};

function getFilePath(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid sheet ID');
  }

  return path.join(
    process.cwd(),
    'data',
    'sheets',
    `${id}.json`
  );
}

// GET: Load saved data
export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const filePath = getFilePath(id);

    const content = await readFile(filePath, 'utf-8');

    return NextResponse.json(JSON.parse(content));

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { message: 'Sheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Load failed' },
      { status: 500 }
    );
  }
}

// PUT: Save data
export async function PUT(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (
      !body ||
      typeof body !== 'object' ||
      !body.data ||
      typeof body.data !== 'object' ||
      !body.styles ||
      typeof body.styles !== 'object'
    ) {
      return NextResponse.json(
        { message: 'Invalid sheet data' },
        { status: 400 }
      );
    }

    const filePath = getFilePath(id);

    await mkdir(path.dirname(filePath), {
      recursive: true
    });

    await writeFile(
      filePath,
      JSON.stringify(body, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
      message: 'Saved successfully'
    });

  } catch {
    return NextResponse.json(
      { message: 'Save failed' },
      { status: 500 }
    );
  }
}
