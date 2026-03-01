import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymbgchicrsmbbkkuxtti.supabase.co'
const supabaseKey = 'sb_publishable_LC-d8gfrNlGbIHSX-UqJLQ_hYZ9pGHf'

export const supabase = createClient(supabaseUrl, supabaseKey)