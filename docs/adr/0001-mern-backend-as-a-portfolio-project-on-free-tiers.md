# Add a MERN backend as a portfolio project, on free tiers

The tracker is a browser-only React app. We're adding a MongoDB/Express/Node backend with accounts. The main goal is to have built a full-stack app with authentication, as a portfolio piece. Syncing the owner's data across devices is a secondary benefit. If sync were the only goal, a hosted sync service would do the job for far less work, so several later ADRs deliberately choose to build things by hand rather than buy them. Hosting must cost $0 for now, and that limits where files and servers can live.
