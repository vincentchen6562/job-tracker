# The browser keeps search, filtering, sorting, paging and facet inference

The server only stores and returns applications. After login the browser fetches all of the account's applications in one request. Search, facet filters, sorting, paging and inferred facets all stay in `App.jsx` and `taxonomy.js`, unchanged. One job search is at most a few hundred applications, a few kilobytes of data, so server-side queries would mean rewriting working code and moving the classifier to the server for no benefit. If accounts ever grow to thousands of applications, revisit this.
