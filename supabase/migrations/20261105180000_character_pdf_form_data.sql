alter table public.campaign_characters
  add column character_pdf_form_data jsonb not null default '{}'::jsonb
    check (
      jsonb_typeof(character_pdf_form_data) = 'object'
      and octet_length(character_pdf_form_data::text) <= 524288
    );
