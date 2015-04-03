# OpenQuery
A no-nonsense OData query url builder with zero dependencies. 

##Why this?
OpenQuery provides a way to chain together filter, select, expand, and other commands. There's no caching, no complicated client-side framework. OpenQuery builds the URL, you choose how to get your data.

##How To Use

[Example JSFiddle] (https://jsfiddle.net/rfavillejr/w514cyg4/)

    var query = new OpenQuery();
    query.from("/employees");
    query.let("department", 6)
    .where("item => item.DepartmentId == $department");
    var finalq = query.includeCount(true).skip(10).take(10).toString();
    
outputs the url "/employees?$filter=( DepartmentId eq 6)&$skip=10&$top=10&$inlinecount=allpages". When creating filter/where statements, you must declare it first with a *let* statement, and then "reference" it again in the where clause string.
