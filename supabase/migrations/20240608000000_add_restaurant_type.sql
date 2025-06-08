-- Add restaurant type field to restaurants table
alter table restaurants add type varchar2(20) default 'restaurant' not null;
alter table restaurants
   add constraint chk_restaurant_type check ( type in ( 'restaurant',
                                                        'coffee' ) );