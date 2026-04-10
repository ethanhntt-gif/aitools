insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

create policy "Public can view project assets"
on storage.objects
for select
to public
using (bucket_id = 'project-assets');

create policy "Authenticated users can upload project assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'project-assets');
