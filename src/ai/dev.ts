import { config } from 'dotenv';
config();

import '@/ai/flows/plan-todays-study.ts';
import '@/ai/flows/submit-review.ts';
import '@/ai/flows/get-due-cards.ts';
