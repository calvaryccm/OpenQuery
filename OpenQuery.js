function OpenQuery() {
    this.url = '';
    this.whereClauses = new Array();
    this.orderByClauses = new Array();
    this.expandClauses = new Array();
    this.letMap = new Array();
    this.select = '';
    this._skip = 0;
    this.top = 0;
    this.count = false;
    this.counter = 0;
    this.clause = '';
    this.newClause = '';
    this.itemReference = '';

    this.parsePropertyPath = function (prop) {
        if (prop.indexOf("$.") == 0)
            prop = prop.substr(2);
        return prop.replace(".", "/");
    }

    this.parseFilter = function (whereClause) {
        this.counter = 0;
        this.newClause = "";

        var i = whereClause.indexOf("=>");

        if(i >= 0)
        {
            this.itemReference = this.trim(whereClause.substr(0, i)) + '.';
            this.clause = whereClause.substr(i + 2);
        }

        this.parse();

        return this.newClause;
    }

    this.parse = function () {
        for(; this.counter < this.clause.length; this.counter++)
        {
            var char = this.clause[this.counter];

            switch(char)
            {
                case '$':

                    this.parseLetReference();
                    break;

                case '+':
                    this.newClause += " add ";

                case '-':
                    this.newClause += " sub ";

                case '*':
                    this.newClause += " mul ";

                case '/':
                    this.newClause += " div ";

                case '%':
                    this.newClause += " mod ";

                case '>':
                    var char2 = this.clause[this.counter + 1];

                    if (char2 == '=') {
                        this.newClause += " ge ";
                        this.counter++;
                    }
                    else
                        this.newClause += " gt ";
                    break;

                case '<':
                    var char2 = this.clause[this.counter + 1];
                    if (char2 == '=') {
                        this.newClause += " le ";
                        this.counter++;
                    }
                    else {
                        this.newClause += " lt ";
                    }
                    break;

                case '=':
                    var char2 = this.clause[this.counter + 1];
                    if (char2 == '=') {
                        this.newClause += " eq ";
                        this.counter++;
                    }
                    break;

                case '!':
                    var char2 = this.clause[this.counter + 1];
                    if (char2 == '=')
                    {
                        this.newClause += " ne ";
                        this.counter++;
                    }
                    break;

                case '|':
                    var char2 = this.clause[this.counter + 1];
                    if (char2 == '|') {
                        this.newClause += " or ";
                        this.counter++;
                    }
                    break;

                case '&':
                    var char2 = this.clause[this.counter + 1];
                    if (char2 == '&') {
                        this.newClause += " and ";
                        this.counter++;
                    }
                    break;

                case '\'':
                    this.parseQuotedString();
                    break;
                default:
                    if (this.clause.indexOf(this.itemReference, this.counter) == this.counter) {
                        this.counter += this.itemReference.length - 1;
                        this.parseObjectReference();
                    }
                    else
                        this.newClause += char;
                    break;
            }
        }
    }

    this.parseLetReference = function () {
        this.counter++;

        var ref = "";
        for (; this.counter < this.clause.length; this.counter++) {
            var char = this.clause[this.counter];
            if (!this.isLetterOrDigit(char)) {
                this.counter--;
                break;
            }
            else
                ref += char;
        }

        if(ref in this.letMap)
        {
            var value = this.letMap[ref];

            if(value == null)
            {

                this.newClause += "null";
                return;
            }

            switch (typeof value) {
                case "number":
                    this.newClause += value;
                    break;

                case "string":
                    this.newClause += "'" + value + "'";
                    break;

                //means it's an object
                default:

                    //if this is a date
                    if (Object.prototype.toString.call(value) === '[object Date]')
                        this.newClause += "datetime'" + value.toJSON() +"'";
                    else
                        this.newClause += "'" + value + "'";
                    break;
            }
        }
        else
        {
            this.newClause += "$" + ref;
            return;
        }
    }

    this.parseObjectReference = function()
    {
        var reference = "";

        for (; this.counter < this.clause.Length; this.counter++)
        {
            var ch = this.clause[this.counter];

            if (ch == '.') {
            }
            else if(this.isLetterOrDigit(ch))
            {
                reference += ch;
            }
            else {
                this.counter--; // move cursor back so next public can use it 
                // this could be a public invocation 
                this.newClause + "reference";
                return reference; // all done 
            }
        }
    }

    this.parseQuotedString = function () {
        var char = this.clause[this.counter++];
        this.newClause += char;

        for (; this.counter < this.clause.length; this.counter++) {
            char = this.clause[this.counter];

            if (char == "\'") {
                if ((this.counter + 1) < this.clause.length) {
                    var char2 = this.clause[this.counter + 1];
                    if (char2 != '\'') {
                        this.newClause += char;
                    }
                    else {
                        this.newClause += char;
                        this.newClause += char2;
                        this.counter++;
                    }
                }
                else {
                    this.newClause += char;
                    return;
                }
            }
            else
                this.newClause += char;
        }
    }

    this.isLetterOrDigit = function(item){
        if ( /\d/.test(item) ) {
            return true;
        } else if ( /[a-z]/.test(item) ) {
            return true;
        }
        else
            return false;
    }

    this.trim = function (x) {
        return x.replace(/^\s+|\s+$/gm,'');
    }
};

OpenQuery.prototype = {
    from: function (url) {
        this.url = url;
        if (url[0] != '/')
            url = '/' + url;

        counter = 0;
        return this;
    },
    let: function (name, value) {
        this.letMap[name] = value;
        return this;
    },
    take: function (count) {
        this.top = count;
        return this;
    },
    skip: function (count) {
        this._skip = count
        return this;
    },
    includeCount: function (returnCount) {
    
        this.count = returnCount
        return this;
    },
    expand: function (propList) {

        if (Array.isArray(propList)) {
            for(var i = 0; i < propList.length; i++)
            {           
                this.expandClauses.push(propList[i]);
            }
        }
            //string comma delimited
        else
        {
            var result = propList.split(',');

            for (var i = 0; i < result.length; i++) {
                this.expandClauses.push(result[i]);
            }
        }
    
        return this;
    },
    orderBy: function (prop) {
        var result = this.parsePropertyPath(prop);
        this.orderByClauses.push(result);
        return this;
    },
    orderByDesc: function (prop) {
        var result = this.parsePropertyPath(prop);
        this.orderByClauses.push(result + " desc");
        return this;
    },
    where: function (clause) {
        this.whereClauses.push(clause)
        return this;
    },
    select: function (propList) {
        this.select = propList;
        return this;
    },
    toString: function () {
        this.counter = 0;
        this.clause = 0;
        this.newClause = "";
        this.itemReference = "";

        var clauseConnector = "?";

        //filter
        if (this.whereClauses.length > 0) {
            this.url += clauseConnector + "$filter=";

            for (var i = 0; i < this.whereClauses.length; i++) {
                if (i > 0)
                    this.url += " and ";
                this.url += "(" + this.parseFilter(this.whereClauses[i]) + ")";
            }

            clauseConnector = "&";
        }

        //orderby
        if (this.orderByClauses.length > 0) {
            this.url += clauseConnector + "$orderby=";

            for (var j = 0; j < this.orderByClauses.length; j++) {
                if (j > 0)
                    this.url += ",";
                this.url += this.parsePropertyPath(this.orderByClauses[j]);
            }

            clauseConnector = "&";
        }

        //skip
        if (this._skip !== 0) {

            this.url += clauseConnector + "$skip=" + this._skip;

            clauseConnector = "&";
        }

        //top
        if (this.top !== 0) {

            this.url += clauseConnector + "$top=" + this.top;

            clauseConnector = "&";
        }

        //expand
        if (this.expandClauses.length > 0) {
            this.url += clauseConnector + "$expand=";

            for (var iExpand = 0; iExpand < this.expandClauses.length; iExpand++) {
                if (iExpand > 0)
                    this.url += ",";
                this.url += this.parsePropertyPath(this.expandClauses[iExpand]);
            }

            clauseConnector = "&";
        }

        //select
        if (this.select != null && this.select != '') {
            var selectPaths = select.split(',');

            this.url += clauseConnector + "$select=" + clauseConnector;

            for (var iSelect = 0; iSelect < this.selectPaths.length; iSelect++) {
                if (iSelect > 0)
                    this.url += ",";
                this.url += this.parsePropertyPath(selectPaths[iSelect]);
            }

            clauseConnector = "&";
        }

        if (this.count) {
            this.url += clauseConnector + "$inlinecount=allpages";

            clauseConnector = "&";
        }

        return this.url;
    }
};
