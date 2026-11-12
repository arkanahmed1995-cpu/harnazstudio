HARNaz Studio — Website + Private Admin Dashboard
=================================================

Read README_KU.txt for the Sorani Kurdish setup guide.

The package includes the luxury website, private admin sign-in page, image upload/delete dashboard, Supabase client configuration placeholder, portfolio loader, and SQL security policies.

The admin dashboard is prepared but will not work until you connect a Supabase project, create your own admin user, create the public portfolio bucket, run supabase_setup.sql, and fill supabase-config.js. Never place a service_role/secret key in frontend files.

Images uploaded through Admin are appended to the public Portfolio section. The original seven sample images remain in place.
