import { NextResponse } from 'next/server';
import { db } from '@dci/db';
import { locations, dataCenters, scrapeTasks } from '@dci/db';
import { sql, desc, eq, count } from 'drizzle-orm';

export async function GET() {
  try {
    // Get recent locations with successful scrapes
    const recentSearches = await db
      .select({
        county: locations.county,
        state: locations.state,
        lastSearched: sql<string>`MAX(${scrapeTasks.createdAt})`,
        datacenters: count(dataCenters.id),
      })
      .from(locations)
      .leftJoin(scrapeTasks, eq(scrapeTasks.locationId, locations.id))
      .leftJoin(dataCenters, eq(dataCenters.locationId, locations.id))
      .where(eq(scrapeTasks.status, 'success'))
      .groupBy(locations.id, locations.county, locations.state)
      .orderBy(desc(sql`MAX(${scrapeTasks.createdAt})`))
      .limit(10);

    return NextResponse.json(recentSearches);
  } catch (error) {
    console.error('Recent searches error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent searches' },
      { status: 500 }
    );
  }
}