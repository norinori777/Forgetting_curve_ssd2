import type { Prisma } from '@prisma/client';

import type { ListCardsQuery } from '../schemas/cards.js';

function utcTodayRange(now: Date): { start: Date; end: Date } {
	const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
	const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
	return { start, end };
}

export function buildCardBaseFilters(query: ListCardsQuery, now = new Date()): Prisma.CardWhereInput[] {
	const and: Prisma.CardWhereInput[] = [{ isArchived: false }];

	if (query.collection) {
		and.push({ collectionId: query.collection });
	}

	if (query.q) {
		and.push({
			OR: [
				{ title: { contains: query.q, mode: 'insensitive' } },
				{ content: { contains: query.q, mode: 'insensitive' } },
			],
		});
	}

	if (query.tags) {
		const tags = query.tags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		if (tags.length > 0) {
			and.push({
				tags: {
					some: {
						OR: [{ tag: { name: { in: tags } } }, { tagId: { in: tags } }],
					},
				},
			});
		}
	}

	if (query.filter === 'today') {
		const { end } = utcTodayRange(now);
		and.push({ nextReviewAt: { lte: end } });
	}

	if (query.filter === 'overdue') {
		const { start } = utcTodayRange(now);
		and.push({ nextReviewAt: { lt: start } });
	}

	if (query.filter === 'unlearned') {
		and.push({ proficiency: 0 });
	}

	return and;
}
