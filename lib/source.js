﻿

//JS.require('JS.OrderedSet', 'JS.Set');	 // knjiznica za množico

    Path.prototype.vertex = null; // dodajanje novih lastnosti vsem Path objektom
Path.prototype.edgeStart = null; //
Path.prototype.edgeEnd = null; //
Path.prototype.color = null; //
Path.prototype.father = null;
Path.prototype.partition = null; //
Path.prototype.neighbours = null; // postavitev sosedov na tapravi konstrukt - lažja dostopnost prek klika na canvasu
Path.prototype.image = null;
Path.prototype.oldPosition = null;

var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 0
};

function Graph_data_structure() {		// struktura graf
    this.nodes = new Array();
    this.lines = new Array();
}

function node() {		 // struktura node
    //this.neighbours = new Array();
    this.construct = new Path.Circle();
}


//***********-Globalne spremenljivke-*********//
var CLook = view.center;

var Graph = new Graph_data_structure();			// graf
var Graph_loaded = false;

var segment, path;				// drag eventi
var movePath = false;

var addingVertex = false;		// onClick eventi
var addingEdge = false;
var description_system = false;

var addingContent = false;		// spreminjanje imena vozlisc

var Aut_search = false;			//avtomorfizem
var VertexFrom = null;
var VertexTo = null;

var Hamilton_search = false;		// iskanje h. cikla/poti
var Hamilton_vertex = new Array();
var Hamilton_edge = new Array();

var Dp_state = false; // izris particije
var Dvertex_search = false;
var Distance_part_state = false;
var OldPosition_exception = true;

var color_chosen = null;		// barvanje grafa
var graph_coloring = false;
var oddCycle = true;
var fullGraph = true;
var BrooksCount = 0;

var bipartite_state = true; 	// preverjanje dvodelnosti

var EdgeConstruction = false;
var lineExists = false;			// konstrukcija nove povezave
var startingPoint, endPoint;
var setActive = false;

var output_state = false; 	// izpisovanje pravilnosti

var vertex_removal = false;		// brisanje - eventi

//var ozina_premer_grafa = false;

document.getElementById('myCanvas').width = window.innerWidth - 220;
document.getElementById('myCanvas').height = window.innerHeight - 100;

var size = new Size(document.getElementById('myCanvas').width, document.getElementById('myCanvas').height);
view.viewSize = size;

document.getElementById('area').style.width = (window.innerWidth - 225) + 'px';
document.getElementById('area').style.height = 100 + 'px';

//*************-Pritisk miskinega gumba-*****************************************//


function onMouseDown(event) {
    var hitResult = project.hitTest(event.point, hitOptions); // = rezultat hitTesta

    //***********************************Preimenovanje**************************************************//
    if (addingContent == true && hitResult.type == 'fill' && graph_coloring == false && Hamilton_search == false) {
        hitResult.item.selected = true;
        var content_change;
        //addingContent = false;
        do {
            content_change = prompt("Vnesi oznako vozlišča!", "");
        } while (content_change == "" || content_check(content_change) == false);
        if (content_change != null) {
            hitResult.item.vertex.content = content_change;
            hitResult.item.vertex.position = hitResult.item.position;
        }
        //hitResult.item.selected = false;
        //document.getElementById("ButtonRename").style.background='';
        hitResult = null; // Da odznači, zakaj ne dela select??
        paper.view.draw; // ????
    }


    if (bipartite_state == false) {
        for (var i = 0; i < Graph.lines.length ; i++) Graph.lines[i].strokeColor = 'black';
        //for (var i = 0; i < Graph.nodes.length ; i++) Graph.nodes[i].construct.blendMode = 'exclusion';
        bipartite_state = true;
    }
    //************-Iskanje avtomorfizma-************************************//
    if (Aut_search == true) {
        if (hitResult.type == 'fill' && VertexFrom == null) {
            hitResult.item.fillColor = 'red';
            VertexFrom = hitResult.item;
            hitResult.item.attach('mouseleave', function () {
                this.fillColor = 'red';
            });
        } else if (hitResult.type == 'fill' && VertexFrom != null) {
            VertexTo = hitResult.item;
            VertexFrom.image = VertexTo;
            VertexFrom.fillColor = 'blue';
            VertexFrom.attach('mouseleave', function () {
                this.fillColor = 'blue';
            });
            VertexTo = null;
            VertexFrom = null;
            document.getElementById('area').value = "Vozlišča, ki še niso preslikana, so sledeča: ";
            for (var i = 0; i < Graph.nodes.length; i++)
                if (Graph.nodes[i].construct.image == 0) document.getElementById('area').value += Graph.nodes[i].construct.vertex.content + "  ";
            document.getElementById('area').value += "\n" + "Trenutne preslikave avtomorfizma:" + "\n";
            for (var i = 0; i < Graph.nodes.length; i++)
                if (Graph.nodes[i].construct.image != 0) document.getElementById('area').value += Graph.nodes[i].construct.vertex.content + " -> " + Graph.nodes[i].construct.image.vertex.content + "\n";

            var Aut_selected = true;
            for (var i = 0; i < Graph.nodes.length; i++) {
                if (Graph.nodes[i].construct.image == 0) {
                    Aut_selected = false;
                    break;
                }
            }
            //document.getElementById('area').value += Aut_selected+"\n";
            if (Aut_selected == true) {
                if (Check_Aut() == true) document.getElementById('area').value += "To je avtomorfizem grafa.";
                else document.getElementById('area').value += "To ni avtomorfizem grafa.";
            } else {
                for (var j = 0; j < Graph.nodes.length; j++)
                    for (var i = (j + 1) ; i < Graph.nodes.length; i++)
                        if (Graph.nodes[j].construct.image != 0 && Graph.nodes[j].construct.image == Graph.nodes[i].construct.image)
                            document.getElementById('area').value += "Avtomorfizem ni injektiven saj se vozlišči " + Graph.nodes[j].construct.vertex.content + " in " + Graph.nodes[i].construct.vertex.content + " preslikata v isto vozlišče " + Graph.nodes[j].construct.image.vertex.content + " .\n";
            }
        }
    }

    //************-Iskanje Hamiltonove poti/cikla-************************************//
    if (Hamilton_search == true && graph_coloring == false && hitResult.type == 'stroke') {

        if (hitResult.item.strokeColor.red == 0 && hitResult.item.strokeColor.green == 0 && hitResult.item.strokeColor.blue == 0) {
            hitResult.item.strokeColor = 'blue';
            Hamilton_edge[Hamilton_edge.length] = hitResult.item;
            for (var i = 0; i < Graph.nodes.length; i++) {
                if (Graph.nodes[i].construct.vertex.content == hitResult.item.edgeStart.vertex.content || Graph.nodes[i].construct.vertex.content == hitResult.item.edgeEnd.vertex.content) Hamilton_vertex[i] = Hamilton_vertex[i] + 1;
            }
        } else {
            hitResult.item.strokeColor = 'black';
            for (var i = 0; i < Hamilton_edge.length; i++) if (Hamilton_edge[i] == hitResult.item) Hamilton_edge.splice(i, 1);
            //Graph.lines.clean(undefined);
            for (var i = 0; i < Graph.nodes.length; i++) {
                if (Graph.nodes[i].construct.vertex.content == hitResult.item.edgeStart.vertex.content || Graph.nodes[i].construct.vertex.content == hitResult.item.edgeEnd.vertex.content) Hamilton_vertex[i] = Hamilton_vertex[i] - 1;
            }
        }


        var ending_count = 0;
        var Hamilton_found = true;
        for (var i = 0; i < Hamilton_vertex.length; i++) {
            if (Hamilton_vertex[i] != 2) {
                if (Hamilton_vertex[i] == 1) {
                    if (ending_count < 2) ending_count++;
                    else { Hamilton_found = false; break; }
                }
                else { Hamilton_found = false; break; }
            }
        }
        if (Hamilton_found == true) {
            if (ending_count == 2 && Hamilton_edge_check(Hamilton_edge, 2) == true) document.getElementById('area').value += "->Našli ste Hamiltonovo pot!\n";
            else if (Hamilton_edge_check(Hamilton_edge, 1) == true && ending_count == 0) document.getElementById('area').value += "->Našli ste Hamiltonov cikel!\n";
            else if (output_state == true) document.getElementById('area').value += "->Izbrano ne predstavlja Hamiltonovo pot ali cikel!\n";
        } else if (output_state == true) {
            document.getElementById('area').value += "->Izbrano ne predstavlja Hamiltonovo pot ali cikel!\n";
        } else document.getElementById('area').value = "Vključili ste iskanje Hamiltonove poti/cikla.\nS klikom na poljubno povezavo, le-to dodate v svojo pot/cikel ali pa jo odstranite.\n";
    }
    //*****************-Barvanje grafa-*************************//
    if (graph_coloring == true && color_chosen != null && hitResult.item) {
        if (hitResult.type == 'fill' && Dvertex_search == false) {
            var color_skip = color_chosen;
            hitResult.item.fillColor = color_chosen;
            hitResult.item.attach('mouseleave', function () {
                this.fillColor = color_skip;
            });

            if (barvanje()) document.getElementById('area').value += "->Barvanje je ustrezno!" + "\n";
            else if (output_state == true) {
                document.getElementById('area').value += "->Barvanje ni ustrezno!" + "\n";
            } else {
                document.getElementById('area').value = "Vključili ste barvanje grafa. S pomočjo barvne palete lahko sedaj barvate vozlišča.\nKliknite na željeno barvo in lahko pričnete z barvanjem vozlišč!\n";
                if (oddCycle == false && fullGraph == false) {
                    document.getElementById('area').value += "\nGraf ni lih cikel ali poln graf. Po Brooksovem izreku je torej kromatično število grafa manjše ali enako " + BrooksCount + ".\n";
                }
            }
        }
    }
    //************-Razdaljna particija, iskanje zacetnega voz.-************************************//
    if (Dvertex_search == true) {
        if (hitResult.type == 'fill') {
            //document.getElementById('ButtonRazdaljnaParticija').style.background='';
            document.getElementById('area').value = "Razdaljna particija je uspešno izrisana!"
            D_partition_B(hitResult.item);
            OldPosition_exception = false;
            Dvertex_search = false;
        }
        else document.getElementById('area').value += "->Izberite vozlišče!\n";
    }

    //*********************-Brisanje povezave-*************//

    if (hitResult !== null && event.modifiers.shift && hitResult.type == 'stroke' && graph_coloring == false && Hamilton_search == false && Aut_search == false) {
        removeEdge(hitResult.item);
        Graph.lines.clean(undefined);
    }

    //************-Brisanje vozlisca na Canvasu-*************//

    if (hitResult !== null && event.modifiers.shift && hitResult.type == 'fill' && graph_coloring == false && Hamilton_search == false && Aut_search == false) {
        vertex_removal = true;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (typeof (Graph.lines[i]) != "undefined") {
                if ((Graph.lines[i].edgeStart.vertex.content == hitResult.item.vertex.content) || (Graph.lines[i].edgeEnd.vertex.content == hitResult.item.vertex.content)) {
                    removeEdge(Graph.lines[i]);
                }
            }
        }
        Graph.lines.clean(undefined);
        hitResult.item.remove();
        for (var i = 0; i < Graph.nodes.length; i++) {
            if (typeof (Graph.nodes[i].construct) != "undefined")
                if (hitResult.item.vertex.content == Graph.nodes[i].construct.vertex.content) {
                    Graph.nodes[i].construct.vertex.remove();
                    delete Graph.nodes[i];
                    delete Hamilton_vertex[i];
                    break;
                }
        }
        Hamilton_vertex.clean(undefined);
        Graph.nodes.clean(undefined);
        vertex_removal = false;

    }

    //*********-Dodajanje novega vozlišča na Canvas-********//

    if (addingVertex) {
        Hamilton_vertex[Graph.nodes.length] = 0;
        var content_input = 0;
        do {
            content_input++;
        } while (content_check(content_input) == false);

        Graph.nodes[Graph.nodes.length] = new node();
        Graph.nodes[Graph.nodes.length - 1].construct = new Path.Circle(event.point, 12);
        Graph.nodes[Graph.nodes.length - 1].construct.fillColor = "#00F";
        //Graph.nodes[Graph.nodes.length - 1].construct.blendMode = 'exclusion';
        Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseenter', function () {
            this.fillColor = 'red';
        });

        Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseleave', function () {
            if (addingEdge == false || EdgeConstruction == false)
                this.fillColor = 'blue';
            else if (setActive) this.fillColor = 'blue';
        });
        Graph.nodes[Graph.nodes.length - 1].construct.vertex = new PointText;
        Graph.nodes[Graph.nodes.length - 1].construct.vertex.fillColor = 'white';
        Graph.nodes[Graph.nodes.length - 1].construct.vertex.content = content_input;
        Graph.nodes[Graph.nodes.length - 1].construct.vertex.position = Graph.nodes[Graph.nodes.length - 1].construct.position;
        Graph.nodes[Graph.nodes.length - 1].construct.neighbours = new Array();
        Graph_loaded = true;

    }

    //**********-Dodajanje nove povezave na Canvas-**********//
    if (addingEdge) {
        if (EdgeConstruction) {
            if (hitResult.item.position == startingPoint.position) {
                document.getElementById('area').value += "\n->Izberi drugo vozlišče!";
            }
            else if (hitResult && hitResult.item && hitResult.type == 'fill') {
                hitResult.item.fillColor = 'red';
                EdgeConstruction = false;
                setActive = false;
                endPoint = hitResult.item;
                for (var i = 0; i < Graph.lines.length; i++) {
                    if (typeof (Graph.lines[i]) != "undefined") {
                        if (Graph.lines[i].edgeStart.vertex.content == startingPoint.vertex.content || Graph.lines[i].edgeEnd.vertex.content == startingPoint.vertex.content) {
                            if (Graph.lines[i].edgeStart.vertex.content == endPoint.vertex.content || Graph.lines[i].edgeEnd.vertex.content == endPoint.vertex.content) { lineExists = true; break; }
                        }
                    }
                }

                if (lineExists == false) {
                    Graph.lines[Graph.lines.length] = new Path.Line(startingPoint.position, endPoint.position);
                    Graph.lines[Graph.lines.length - 1].edgeStart = startingPoint;
                    Graph.lines[Graph.lines.length - 1].edgeEnd = endPoint;
                    Graph.lines[Graph.lines.length - 1].strokeColor = 'black';
                    Graph.lines[Graph.lines.length - 1].strokeWidth = 4;

                    for (var i = 0; i < Graph.lines.length; i++) {
                        if (typeof (Graph.lines[i]) != "undefined")
                            project.activeLayer.insertChild(0, Graph.lines[i]);
                    }
                } else {
                    document.getElementById('area').value += "\n->Povezava že obstaja!";
                    lineExists = false;
                }

                for (var i = 0; i < Graph.nodes.length; i++) {
                    if (typeof (Graph.nodes[i].construct) != "undefined") {
                        Graph.nodes[i].construct.fillColor = 'blue';
                        if (Graph.nodes[i].construct.vertex.content == startingPoint.vertex.content) {
                            Graph.nodes[i].construct.neighbours.push(endPoint);
                            Graph.nodes[i].construct.attach('mouseleave', function () {
                                if (addingEdge == false || EdgeConstruction == false) this.fillColor = 'blue';
                                else if (setActive) this.fillColor = 'blue';
                            });
                            /*?else?*/
                        } else if (Graph.nodes[i].construct.vertex.content == endPoint.vertex.content) Graph.nodes[i].construct.neighbours.push(startingPoint);
                    }
                }
            }
        } else if (hitResult && hitResult.item && hitResult.type == 'fill') {
            hitResult.item.fillColor = 'red';
            EdgeConstruction = true;
            setActive = true;
            startingPoint = hitResult.item;
            hitResult.item.attach('mouseleave', function () {
                this.fillColor = 'red';
            });
        } else {
            //addingEdge = false;
            //document.getElementById("ButtonNewEdge").style.background='';
        }
    }
    //*****************************************************************************************//
    segment = path = null;

    if (hitResult) {
        path = hitResult.item; // pot postane predmet, na katerega smo kliknili
    }
    if (hitResult !== null) {
        movePath = hitResult.type == 'fill'; // če je tip zadetka polnilo potem omogoci premik za vektor
    }

}
//**************-Pozicija miske nad elementi Canvasa-***************************//
function onResize(event) {
    document.getElementById('myCanvas').width = window.innerWidth - 220;
    document.getElementById('myCanvas').height = window.innerHeight - 100;
    size = new Size(document.getElementById('myCanvas').width, document.getElementById('myCanvas').height);
    view.viewSize = size;
    document.getElementById('area').style.width = window.innerWidth - 225 + 'px';

    for (var j = 0; j < Graph.nodes.length; j++) {
        var CVector = Graph.nodes[j].construct.position - CLook;
        Graph.nodes[j].construct.position = view.center + CVector;
        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }

    CLook = view.center;
}

function onMouseMove(event) {
    if (Graph.nodes.length == 0) {
        Graph_loaded = false;
        //document.getElementById('area').value += "Na canvasu ni nalozenega/narisanega grafa. Platno je prazno."
    }
    if (Hamilton_search == false && bipartite_state == true && Graph_loaded == true) {
        //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = 'exclusion';
    }
    /*if (Hamilton_search === false && ozina_premer_grafa === true && Graph_loaded === true) {
        for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = 'normal';
    }*/
    var hitResult = project.hitTest(event.point, hitOptions);
    project.activeLayer.selected = false;
    if (hitResult && hitResult.item) {   // če pozicija miške nad elementom (vozlišče/povezava) označi kot izbrano
        hitResult.item.selected = true;  // pomoč pri brisanju in barvanju ter izbiri elementa na canvasu
    }
}

//**************************-Vlečenje miške-************************************//

function onMouseDrag(event) {
    if (addingVertex == false && addingContent == false && addingEdge == false && vertex_removal == false && graph_coloring == false) {
        if (movePath) {

            //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = 'normal';

            var bounds_width = view.bounds.width - 10 - (-view.bounds.x);
            var bounds_height = view.bounds.height - 10 - (-view.bounds.y);

            if (path === null) {
                return;
            }
            var zacasni2 = path.position + event.delta;
            if ((zacasni2.x < bounds_width && zacasni2.y < bounds_height) && (zacasni2.x > (view.bounds.x + 10) && zacasni2.y > (view.bounds.y + 10))) { // upoštevanje borderjev
                path.position += event.delta; // premakni ozbrani predmet glede na središče za vektor premika miške
                path.vertex.position += event.delta; // premakni tudi marker

                if (Key.isDown('control')) {
                    var Aqueue = new Array();
                    var Avertex;
                    for (var j = 0; j < Graph.nodes.length; j++) {  // začetne postavke
                        Graph.nodes[j].construct.color = "white";//
                    }
                    path.color = "gray";
                    Aqueue.push(path);

                    while (Aqueue.length > 0) {  	// glavna zanka
                        Avertex = Aqueue.shift();
                        if (Avertex != path) {
                            Avertex.position += event.delta;
                            Avertex.vertex.position += event.delta;
                            for (var i = 0; i < Graph.lines.length; i++) {	// premik vseh povezav glede na izbrano vozlišče
                                if (Graph.lines[i].edgeEnd.vertex.content == Avertex.vertex.content) {
                                    Graph.lines[i].lastSegment.point += event.delta;
                                    if (Graph.lines[i].segments.length == 3) Graph.lines[i].segments[1].point += event.delta / 2;
                                } else if (Graph.lines[i].edgeStart.vertex.content == Avertex.vertex.content) {
                                    Graph.lines[i].firstSegment.point += event.delta;
                                    if (Graph.lines[i].segments.length == 3) Graph.lines[i].segments[1].point += event.delta / 2;
                                }
                            }
                        }
                        for (var j = 0; j < Avertex.neighbours.length; j++) {
                            if (Avertex.neighbours[j].color == "white") {
                                Avertex.neighbours[j].color = "gray";
                                Aqueue.push(Avertex.neighbours[j]);
                            }
                        }
                    }
                }

                for (var i = 0; i < Graph.lines.length; i++) {	// premik vseh povezav glede na izbrano vozlišče
                    if (Graph.lines[i].edgeEnd.vertex.content == path.vertex.content) {
                        Graph.lines[i].lastSegment.point += event.delta;
                        if (Graph.lines[i].segments.length == 3 && Key.isDown('control') == false) {
                            Graph.lines[i].removeSegment(1);
                            Graph.lines[i].flatten(1000);
                        } else if (Graph.lines[i].segments.length == 3 && Key.isDown('control') == true) {
                            Graph.lines[i].segments[1].point += event.delta / 2;
                        }
                    } else if (Graph.lines[i].edgeStart.vertex.content == path.vertex.content) {
                        Graph.lines[i].firstSegment.point += event.delta;
                        if (Graph.lines[i].segments.length == 3 && Key.isDown('control') == false) {
                            Graph.lines[i].removeSegment(1);
                            Graph.lines[i].flatten(1000);
                        } else if (Graph.lines[i].segments.length == 3 && Key.isDown('control') == true) {
                            Graph.lines[i].segments[1].point += event.delta / 2;
                        }
                    }
                }
            } else if ((zacasni2.x == bounds_width || zacasni2.y == bounds_height) || (zacasni2.x == (view.bounds.x + 10) || zacasni2.y == (view.bounds.y + 10))) { // vlečenje izven borderja-prekini dejavni premik
                path.selected = false;
                path = null;
                return;
            }

            //for (var j=0;j<Graph.nodes.length;j++) Graph.nodes[j].construct.blendMode = 'exclusion';

        }
    }
}
//*******************************-Avtomorfizem - preverjanje (function)-************************************************//
function Check_Aut() {
    document.getElementById('area').value += "\n";
    for (var i = 0; i < Graph.nodes.length; i++) {
        if (Graph.nodes[i].construct.image.neighbours.length != Graph.nodes[i].construct.neighbours.length) {
            document.getElementById('area').value += "Vozlišče " + Graph.nodes[i].construct.vertex.content + " stopnje " + Graph.nodes[i].construct.neighbours.length + " smo preslikali v vozlišče " + Graph.nodes[i].construct.image.vertex.content + ", ki je stopnje " + Graph.nodes[i].construct.image.neighbours.length + ".\n";
            return false;
        }
        for (var j = 0; j < Graph.nodes[i].construct.neighbours.length; j++) {
            if (Graph.nodes[i].construct.image.neighbours.indexOf(Graph.nodes[i].construct.neighbours[j].image) == -1) {
                document.getElementById('area').value += "Vozlišči " + Graph.nodes[i].construct.vertex.content + " in " + Graph.nodes[i].construct.neighbours[j].vertex.content + " pri izbranem avtomorfizmu več nista soseda!\n";
                return false;
            }
        }
    }
    return true;
}
//*******************************-Hamilton-preverjanje povezav-************************************************//
function Hamilton_edge_check(Edges, mode) {
    var edge_start;
    var edge_confirmed;
    var edge_switched = false;
    if (mode == 2) {
        //window.alert("1");
        for (var i = 0; i < Hamilton_vertex.length; i++) if (Hamilton_vertex[i] == 1) {
            edge_start = Graph.nodes[i].construct;
            break;
        }
        for (var i = 0; i < Edges.length; i++) {
            if (Edges[i].edgeStart == edge_start || Edges[i].edgeEnd == edge_start) edge_confirmed = Edges[i];
        }
    } else {
        //window.alert("2");
        edge_confirmed = Graph.lines[0];
        edge_start = Graph.lines[0].edgeStart;
    }

    for (var i = 0; i < Edges.length; i++) Edges[i].color = "white";
    edge_confirmed.color = "gray";

    do {
        edge_switched = false;
        if (edge_start == edge_confirmed.edgeStart) edge_start = edge_confirmed.edgeEnd;
        else if (edge_start == edge_confirmed.edgeEnd) edge_start = edge_confirmed.edgeStart;

        for (var i = 0; i < Edges.length; i++) if ((edge_start == Edges[i].edgeStart || edge_start == Edges[i].edgeEnd) && Edges[i].color == "white") {
            edge_confirmed = Edges[i];
            Edges[i].color = "gray";
            edge_switched = true;
        }
    } while (edge_switched);
    for (var i = 0; i < Edges.length; i++) if (Edges[i].color == "white") return false;
    return true;
}
//*******************************-Izravnava povezav-************************************************//
function Graph_flatten(Graph) {
    for (var j = 0; j < Graph.lines.length; j++) {
        if (Graph.lines[j].segments.length == 3) {
            Graph.lines[j].removeSegment(1);
            Graph.lines[j].flatten(1000);
        }
    }
    document.getElementById('area').value = "Vse povezave so bile poravnane!\n"
}
//*******************************-Povezan/Nepovezan graf-************************************************//
function Connected(Graph) {
    var Cqueue = new Array();
    var Cvertex;
    for (var j = 1; j < Graph.nodes.length; j++) {  // začetne postavke
        Graph.nodes[j].construct.color = "white";//
    }
    Graph.nodes[0].construct.color = "gray";
    Cqueue.push(Graph.nodes[0].construct);

    while (Cqueue.length > 0) {  	// glavna zanka
        Cvertex = Cqueue.shift();
        for (var j = 0; j < Cvertex.neighbours.length; j++) {
            if (Cvertex.neighbours[j].color == "white") {
                Cvertex.neighbours[j].color = "gray";
                Cqueue.push(Cvertex.neighbours[j]);
            }
        }
    }
    for (var j = 0; j < Graph.nodes.length; j++)
        if (Graph.nodes[j].construct.color == "white") return false;
    return true;
}
//*******************************-Postavitev razdaljne particije (vmesne povezave)-************************************************//
function Partition_positioning() {

    if (Dp_state == false) {
        for (var j = 0; j < Graph.lines.length; j++) {
            if (Graph.lines[j].edgeStart.partition == Graph.lines[j].edgeEnd.partition) {
                Graph.lines[j].insert(1, Graph.lines[j].position);
                Graph.lines[j].segments[1].point.x += 40;
                Graph.lines[j].smooth();
            }
        }
        Dp_state = true;
    }
}
//*******************************-Postavitev dvodelnega grafa-***************************************************//
function Bipartite_positioning() {
    var pos_p1 = new Point(300, 80);
    var pos_p2 = new Point(450, 80);
    for (var j = 0; j < Graph.nodes.length; j++) {
        if (Graph.nodes[j].construct.partition == 1) {
            Graph.nodes[j].construct.position = pos_p1;
            Graph.nodes[j].construct.vertex.position = pos_p1;
            pos_p1.y += 40;
        }
        else {
            Graph.nodes[j].construct.position = pos_p2;
            Graph.nodes[j].construct.vertex.position = pos_p2;
            pos_p2.y += 40;
        }
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
}
//*******************************-Barvanje grafa (funkcija)-***************************************************//
function barvanje() {
    for (var j = 0; j < Graph.nodes.length; j++) {
        for (var i = 0; i < Graph.nodes[j].construct.neighbours.length; i++) {
            //if (Graph.nodes[j].construct.neighbours.indexOf(Graph.nodes[i].construct) != -1){
            if (Graph.nodes[j].construct.fillColor == Graph.nodes[j].construct.neighbours[i].fillColor) return false;
            //}
        }
    }
    return true;
}
//**********************-Pregled oznak (funkcija)-**************************************************************//
function content_check(vertex_content) {
    for (var j = 0; j < Graph.nodes.length; j++) {
        if (Graph.nodes[j].construct.vertex.content == vertex_content) return false; // ali oznaka že obstaja
    }
    return true;
}

//****************-Globalne funkcije-***********//

Array.prototype.clean = function (deleteValue) {	// brisanje praznih prostorov za array
    for (var i = 0; i < this.length; i++) {	// dodajanje nove funkcije za Array
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;									// povzeto po: http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript, dne 13.3.2013
        }
    }
    return this;
};
//*************************- Generiranje konstruktov, branje grafa iz datoteke (button) -*************************//
function readSingleFile(evt) {
    //(beri samo eno datoteko)
    var f = evt.target.files[0];

    if (f && Graph_loaded == false) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var coordinates_exist = false;
            var contents = e.target.result; // rezultat branja datoteke
            var pomozni_str = contents.substr(0, contents.indexOf("\n") - 1); // string vozlisc
            contents = contents.substr(contents.indexOf("\n") + 1); // string povezav
            var pomozni2_str = contents.substr(0, contents.indexOf("\n") - 1);
            if (pomozni2_str[0] == "[") {
                coordinates_exist = true;
                contents = contents.substr(contents.indexOf("\n") + 1);
            }

            pomozni2_str = pomozni2_str.replace(/\s+/g, ''); //brisi presledke
            pomozni_str = pomozni_str.replace(/\s+/g, ' ');  //brisi dvojne presledke
            contents = contents.replace(/\s+/g, ''); // brisi presledke

            var stevec = 0;
            while (pomozni_str.length > 0) {

                //*Vozlisca*//
                //* Konstrukcija na canvasu - POZICIJE*//
                var coordinates = new Point;
                if (coordinates_exist == true) { // če so koordinate beležene jih upoštevaj, čene določi random pozicijo vozlišča
                    coordinates.x = parseInt(pomozni2_str.substr(pomozni2_str.indexOf("[") + 1, pomozni2_str.indexOf(",") - 1));
                    pomozni2_str = pomozni2_str.substr(pomozni2_str.indexOf(",") + 1);
                    coordinates.y = parseInt(pomozni2_str.substr(0, pomozni2_str.indexOf("]")));
                } else {
                    coordinates.x = Math.floor((Math.random() * 700) + 1);
                    coordinates.y = Math.floor((Math.random() * 450) + 1);
                }

                //* Konstrukcija na canvasu - VOZLISCE*//
                Graph.nodes[Graph.nodes.length] = new node();
                Graph.nodes[Graph.nodes.length - 1].construct = new Path.Circle(coordinates, 12);
                Graph.nodes[Graph.nodes.length - 1].construct.fillColor = "#00F";
                //Graph.nodes[Graph.nodes.length - 1].construct.blendMode = 'exclusion';

                Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseenter', function () {
                    this.fillColor = 'red';
                });
                Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseleave', function () {
                    if (addingEdge == false || EdgeConstruction == false)
                        this.fillColor = 'blue';
                    else if (setActive) this.fillColor = 'blue';
                });
                Graph.nodes[Graph.nodes.length - 1].construct.vertex = new PointText;
                Graph.nodes[Graph.nodes.length - 1].construct.vertex.fillColor = 'white';


                Hamilton_vertex[stevec] = 0;
                stevec++;

                if (pomozni_str.indexOf(" ") == -1) {
                    Graph.nodes[Graph.nodes.length - 1].construct.vertex.content = pomozni_str.substr(0, pomozni_str.indexOf("."));
                    pomozni_str = "";
                }
                else {
                    Graph.nodes[Graph.nodes.length - 1].construct.vertex.content = pomozni_str.substr(0, pomozni_str.indexOf(" "));
                    pomozni_str = pomozni_str.substr(pomozni_str.indexOf(" ") + 1);
                    pomozni2_str = pomozni2_str.substr(pomozni2_str.indexOf("]") + 1);
                }
                Graph.nodes[Graph.nodes.length - 1].construct.vertex.position = Graph.nodes[Graph.nodes.length - 1].construct.position;

                Graph.nodes[Graph.nodes.length - 1].construct.neighbours = new Array();

                //**//
            } //*Povezave*//
            contents = contents.replace(/(\r\n|\n|\r)/gm, "");

            while (contents.length > 0) {
                var start = null;
                var end = null;
                pomozni_str = contents.substr(0, contents.indexOf("}"));
                for (var j = 0; j < Graph.nodes.length; j++) {  // določitev koordinat za risanje povezave
                    if (start != null && end != null) break;
                    //document.getElementById('area').value += pomozni_str.substr(pomozni_str.indexOf("{")+1,pomozni_str.indexOf(",")-1)+","+pomozni_str.substr(pomozni_str.indexOf(",")+1)+" ";
                    if (Graph.nodes[j].construct.vertex.content == pomozni_str.substr(pomozni_str.indexOf("{") + 1, pomozni_str.indexOf(",") - 1)) start = Graph.nodes[j];
                    else if (Graph.nodes[j].construct.vertex.content == pomozni_str.substr(pomozni_str.indexOf(",") + 1)) end = Graph.nodes[j];
                }

                start.construct.neighbours.push(end.construct); // dodajanje sosedov - id
                end.construct.neighbours.push(start.construct); // ->

                //* Konstrukcija na canvasu - POVEZAVA*//
                Graph.lines[Graph.lines.length] = new Path.Line(start.construct.position, end.construct.position);
                Graph.lines[Graph.lines.length - 1].edgeStart = start.construct;
                Graph.lines[Graph.lines.length - 1].edgeEnd = end.construct;
                Graph.lines[Graph.lines.length - 1].strokeColor = 'black';
                Graph.lines[Graph.lines.length - 1].strokeWidth = 4;
                contents = contents.substr(contents.indexOf("}") + 1);

            }
            for (var i = 0; i < Graph.lines.length; i++) { // postavitev crt pod vozlisca, layer nizje
                project.activeLayer.insertChild(0, Graph.lines[i]);
            }

            if (coordinates_exist == false) { Draw_circular(0); }
            document.getElementById('area').value = "Graf je naložen!";
            Graph_loaded = true;
        }
        reader.readAsText(f); // beri file kot text
    } else {
        alert("Datoteka ni bila naložena!");
    }
}
document.getElementById('fileinput').addEventListener('change', readSingleFile, false); // povezava na input type
//*************************- Shranjevanje grafa (button) -***********************************//

saveFile = function () {
    var string_to_file = "";
    if (Graph_loaded) {
        document.getElementById('area').value = "Spodaj generirana notacija predstavlja obstoječi graf. Notacijo kopirajte v tekstovno datoteko in shranite.\n\n";
        for (var j = 0; j < Graph.nodes.length; j++) {
            if (j == Graph.nodes.length - 1) {
                document.getElementById('area').value += Graph.nodes[j].construct.vertex.content + ".";
                string_to_file = string_to_file.concat(Graph.nodes[j].construct.vertex.content + ".");
            } else {
                document.getElementById('area').value += Graph.nodes[j].construct.vertex.content + " ";
                string_to_file = string_to_file.concat(Graph.nodes[j].construct.vertex.content + " ");
            }
        }
        document.getElementById('area').value += "\n";
        string_to_file = string_to_file.concat("\r\n");

        for (var j = 0; j < Graph.nodes.length; j++) {
            if (j == Graph.nodes.length - 1) {
                document.getElementById('area').value += "[" + Graph.nodes[j].construct.position.x + "," + Graph.nodes[j].construct.position.y + "]";
                string_to_file = string_to_file.concat("[" + Graph.nodes[j].construct.position.x + "," + Graph.nodes[j].construct.position.y + "]");
            } else {
                document.getElementById('area').value += "[" + Graph.nodes[j].construct.position.x + "," + Graph.nodes[j].construct.position.y + "]" + " ";
                string_to_file = string_to_file.concat("[" + Graph.nodes[j].construct.position.x + "," + Graph.nodes[j].construct.position.y + "]" + " ");
            }
        }
        document.getElementById('area').value += "\n";
        string_to_file = string_to_file.concat("\r\n");

        for (var i = 0; i < Graph.lines.length; i++) {
            if (i == Graph.lines.length - 1) {
                document.getElementById('area').value += "{" + Graph.lines[i].edgeStart.vertex.content + "," + Graph.lines[i].edgeEnd.vertex.content + "}";
                string_to_file = string_to_file.concat("{" + Graph.lines[i].edgeStart.vertex.content + "," + Graph.lines[i].edgeEnd.vertex.content + "}");
            } else {
                document.getElementById('area').value += "{" + Graph.lines[i].edgeStart.vertex.content + "," + Graph.lines[i].edgeEnd.vertex.content + "}" + "\n";
                string_to_file = string_to_file.concat("{" + Graph.lines[i].edgeStart.vertex.content + "," + Graph.lines[i].edgeEnd.vertex.content + "}" + "\r\n");
            }
        }


        var text_blob = new Blob([string_to_file], { type: 'text/plain' });
        var download_name = "graph";										// povzeto po: http://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/, dne 15.3.2013

        var initializeDownload = document.createElement("a");
        initializeDownload.download = download_name;
        /*initializeDownload.innerHTML = "Download File";
        if (window.webkitURL != null)
        {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            initializeDownload.href = window.webkitURL.createObjectURL(text_blob);
        }
        else
        {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            initializeDownload.href = window.URL.createObjectURL(text_blob);
            initializeDownload.onclick = destroyClickedElement;
            initializeDownload.style.display = "none";
            document.body.appendChild(initializeDownload);
        }*/
        initializeDownload.href = window.URL.createObjectURL(text_blob);

        initializeDownload.click();

    }
}
/*function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}*/

//*************************- Brisanje povezave-funkcija -***********************************//
removeEdge = function (edge) {
    for (var i = 0; i < Graph.nodes.length; i++) {
        if (Graph.nodes[i].construct.vertex.content == edge.edgeStart.vertex.content) {
            Graph.nodes[i].construct.neighbours.clean(edge.edgeEnd);
        } else if (Graph.nodes[i].construct.vertex.content == edge.edgeEnd.vertex.content) {
            Graph.nodes[i].construct.neighbours.clean(edge.edgeStart);
        }
    }
    edge.remove();
    for (var i = 0; i < Graph.lines.length; i++) {
        if (typeof (Graph.lines[i]) != "undefined")
            if ((edge.edgeStart == Graph.lines[i].edgeStart) && (edge.edgeEnd == Graph.lines[i].edgeEnd)) delete Graph.lines[i];
    }
}
//*************************- Dodajanje vozlisc (button) -***********************************//
addVertex = function () {
    if (addingVertex == false && Dp_state == false) {
        clearButtons(2);

        addingVertex = true;
        document.getElementById("ButtonNewVertex").style.background = 'red';
        document.getElementById('area').value = "Izbrana je opcija za dodajanje novih vozlišč. \nS klikom na canvas določimo mesto kjer bo novo vozlišče generirano.";
    }
    else if (Dp_state == false && Hamilton_search == false) {
        addingVertex = false;
        document.getElementById("ButtonNewVertex").style.background = '';
        document.getElementById('area').value = "Dodajanje vozlišč izključeno."
    }
}
//*************************- Dodajanje povezav (button) -***********************************//
addEdge = function () {
    if (addingEdge == false && Dp_state == false) {
        clearButtons(1);
        addingEdge = true;
        document.getElementById("ButtonNewEdge").style.background = 'red';
        document.getElementById('area').value = "Izbrana je opcija za dodajanje novih povezav. \nS prvim klikom na vozlišče izberemo začetek nove povezave. Nato izberemo se vozlišče, kjer se povezava zaključi.\nDvojnih povezav ne moremo ustvariti, prav tako ne more imeti povezava začetek in konec v istem vozlišču.";
    }
    else if (Dp_state == false && Hamilton_search == false) {
        addingEdge = false;
        clearButtons(7); // zbrisat??
        document.getElementById("ButtonNewEdge").style.background = '';
        document.getElementById('area').value = "Dodajanje povezav izključeno.";
    }

}
//*************************- Oznake (button) -***********************************//
description = function () {
    if (description_system == false) {
        for (var j = 0; j < Graph.nodes.length; j++)
            if (typeof (Graph.nodes[j].construct) != "undefined") Graph.nodes[j].construct.vertex.visible = false;
        description_system = true;
        document.getElementById('area').value = "Oznake vozlišč so skrite.";
    } else if (description_system == true) {
        for (var j = 0; j < Graph.nodes.length; j++)
            if (typeof (Graph.nodes[j].construct) != "undefined") Graph.nodes[j].construct.vertex.visible = true;
        description_system = false;
        document.getElementById('area').value = "Oznake vozlišč so vidne.";
    }
}
//*************************- Random sprememba koordinat vozlisc (button) -***********************************//
shuffle = function () {
    if (Dp_state == true) {
        Graph_flatten(Graph);
        Dp_state = false;
    }
    var bounds_width = view.bounds.width - 10 - (-view.bounds.x); // dinamično spreminjanje mej canvasa
    var bounds_height = view.bounds.height - 10 - (-view.bounds.y);
    for (var j = 0; j < Graph.nodes.length; j++) {
        Graph.nodes[j].construct.position = new Point(Math.floor((view.bounds.x + 10 + Math.random() * (bounds_width - view.bounds.x - 10))), Math.floor((view.bounds.y + 10 + Math.random() * (bounds_height - view.bounds.y - 10))));
        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
}
//*************************- Izpis sosedov (help) -***********************************//
V_neighbours = function () {
    document.getElementById('area').value = "";
    for (var j = 0; j < Graph.nodes.length; j++) {
        for (var i = 0; i < Graph.nodes[j].construct.neighbours.length; i++) document.getElementById('area').value += Graph.nodes[j].construct.neighbours[i].vertex.content + ", ";
        document.getElementById('area').value += "\n";
    }
}
//*************************- Barvanje grafa (button) -***********************************//
colorize = function () {
    if (Graph_loaded) {
        if (graph_coloring == false) {
            clearButtons(3);
            graph_coloring = true;
            document.getElementById('area').value = "Vključili ste barvanje grafa. S pomočjo barvne palete lahko sedaj barvate vozlišča.\nKliknite za željeno barvo in lahko pričnete z barvanjem vozlišč!\n";
            document.getElementById("ButtonColorGraph").style.background = 'red'; // prikazi paleto
            document.getElementById("button5").style.visibility = 'visible';
            document.getElementById("button6").style.visibility = 'visible';
            document.getElementById("button7").style.visibility = 'visible';
            document.getElementById("button8").style.visibility = 'visible';
            document.getElementById("button9").style.visibility = 'visible';
            document.getElementById("button10").style.visibility = 'visible';
            document.getElementById("button11").style.visibility = 'visible';
            document.getElementById("button12").style.visibility = 'visible';
            document.getElementById("button22").style.visibility = 'visible';
            document.getElementById("button21").style.visibility = 'visible';
            //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = 'normal';
            if (Connected(Graph) == true) {
                oddCycle = true;
                fullGraph = true;
                BrooksCount = 0;

                if ((Graph.nodes.length % 2) == 1) {
                    for (var j = 0; j < Graph.nodes.length; j++) {
                        if (Graph.nodes[j].construct.neighbours.length != 2) {
                            oddCycle = false;
                            break;
                        }
                    }
                } else oddCycle = false;
                for (var j = 0; j < Graph.nodes.length; j++) {
                    if (Graph.nodes[j].construct.neighbours.length > BrooksCount) BrooksCount = Graph.nodes[j].construct.neighbours.length;
                    if (Graph.nodes[j].construct.neighbours.length != (Graph.nodes.length - 1)) fullGraph = false;
                }
                if (oddCycle == false && fullGraph == false) {
                    document.getElementById('area').value += "\nGraf ni lih cikel ali poln graf. Po Brooksovem izreku je torej kromatično število grafa manjše ali enako " + BrooksCount + ".\n";
                }
            }
        } else {
            graph_coloring = false;
            document.getElementById('area').value = "Barvanje grafa je izključeno.";
            document.getElementById("ButtonColorGraph").style.background = '';
            document.getElementById("button5").style.visibility = 'hidden'; // skrij paleto
            document.getElementById("button6").style.visibility = 'hidden';
            document.getElementById("button7").style.visibility = 'hidden';
            document.getElementById("button8").style.visibility = 'hidden';
            document.getElementById("button9").style.visibility = 'hidden';
            document.getElementById("button10").style.visibility = 'hidden';
            document.getElementById("button11").style.visibility = 'hidden';
            document.getElementById("button12").style.visibility = 'hidden';
            document.getElementById("button22").style.visibility = 'hidden';
            document.getElementById("button21").style.visibility = 'hidden';
            for (var j = 0; j < Graph.nodes.length; j++) {
                Graph.nodes[j].construct.fillColor = "#00F";
                //Graph.nodes[j].construct.blendMode = "exclusion";
                Graph.nodes[j].construct.attach('mouseleave', function () {
                    this.fillColor = "#00F";
                });
                Graph.nodes[j].construct.attach('mouseenter', function () {
                    this.fillColor = 'red';
                });
            }
        }
    }
}
//*************************- Izbira barve iz barvne palete (buttons) -***************************//
color_choice = function (obj) {
    color_chosen = obj.style.backgroundColor; // barva izbranega gumba v paleti
    for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.attach('mouseenter', function () {
        this.fillColor = obj.style.backgroundColor;
    });
    //window.alert(""+obj.style.background);
}
//*************************- Hamiltonova pot/cikel (button) -************************************//
Hamilton = function () {
    if (Graph_loaded) {
        if (Hamilton_search == false) {
            for (var i = 0; i < Graph.lines.length ; i++) Graph.lines[i].strokeColor = 'black';
            bipartite_state = true;
            Hamilton_search = true;
            clearButtons(4);
            document.getElementById('area').value = "Vključili ste iskanje Hamiltonove poti/cikla.\nS klikom na poljubno povezavo, le-to dodate v svojo pot/cikel ali pa jo odstranite.\n";
            document.getElementById("ButtonHamilton").style.background = 'red';
            //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = 'normal'; // izkljucitev prekrivanja zaradi povezav
        } else {
            Hamilton_edge.length = 0;
            Hamilton_search = false;
            document.getElementById('area').value = "Iskanje Hamiltonove poti/cikla izključeno.";
            document.getElementById("ButtonHamilton").style.background = '';
            //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = "exclusion"; // ponovna vkljucitev po izklopu
            for (var j = 0; j < Graph.lines.length; j++) Graph.lines[j].strokeColor = 'black'; // umaknemo izbrane - barvane povezave
            for (var i = 0; i < Hamilton_vertex.length; i++) Hamilton_vertex[i] = 0; // vrnemo privzete vrednosti v glavno Hamilton-tabelo
        }
    }
}

//*************************- Dvodelnost (glavni del) -*******************************************//
Bipartite = function () { // podobno kot razdaljna particija
    var Bqueue = new Array();
    var Bvertex;
    for (var j = 0; j < Graph.nodes.length; j++) {  // začetne postavke
        Graph.nodes[j].construct.color = "white";//
        Graph.nodes[j].construct.partition = 0;//
    }
    var zac_ind = Math.floor(Math.random() * Graph.nodes.length);
    Graph.nodes[zac_ind].construct.color = "gray";//
    Graph.nodes[zac_ind].construct.partition = 1;//

    Bqueue.push(Graph.nodes[zac_ind].construct);

    while (Bqueue.length > 0) {  	// glavna zanka

        Bvertex = Bqueue.shift();

        for (var j = 0; j < Bvertex.neighbours.length; j++) {
            if (Bvertex.partition == Bvertex.neighbours[j].partition) { // v primeru da imata soseda isto doloceno particijo, koncamo, ni dvodelen
                document.getElementById('area').value = "Graf NI dvodelen, saj vsebuje lihi cikel!";
                //window.alert(""+Bvertex.vertex.content);
                Cycle(Bvertex);
                return;
            }
            else { // spreminjamo postavke
                if (Bvertex.neighbours[j].color == "white") {
                    Bvertex.neighbours[j].color = "gray";
                    Bvertex.neighbours[j].partition = 3 - Bvertex.partition;
                    Bqueue.push(Bvertex.neighbours[j]);
                }
            }
        }
    }
    Bipartite_positioning(); // funkcija - izris dvodelnega grafa
    document.getElementById('area').value = "Graf JE dvodelen!";
}
//*********************************************-Iskanje cikla********************************************//
Cycle = function (start) {
    var vertex;
    var CLine_array = new Array();

    bipartite_state = false;
    //for (var i = 0; i < Graph.nodes.length ; i++) Graph.nodes[i].construct.blendMode = 'normal';

    var stack = new Array();
    for (var j = 0; j < Graph.nodes.length; j++) {  // začetne postavke
        Graph.nodes[j].construct.color = "white";//
        Graph.nodes[j].construct.father = null;
        Graph.nodes[j].construct.partition = 0;//
    }
    start.color = "gray";
    start.partition = 1;
    start.father = 1;
    stack.push(start);
    var counter = 0;

    while (stack.length > 0) {
        vertex = stack.pop();
        if (vertex.neighbours.length == 1) {
            for (var j = CLine_array.length - 1; j > -1 ; j--) {
                if (CLine_array[j].edgeStart != stack[stack.length - 1].father && CLine_array[j].edgeEnd != stack[stack.length - 1].father) {
                    CLine_array[j].strokeColor = 'black';
                } else if (vertex.father != stack[stack.length - 1].father) {
                    CLine_array[j].strokeColor = 'black';
                    break;
                } else break;
            }
        } else {
            counter = 0;
            if (vertex != start && vertex.neighbours.length > 1) {
                for (var i = 0; i < Graph.lines.length ; i++)
                    if ((Graph.lines[i].edgeStart == vertex || Graph.lines[i].edgeStart == vertex.father) && (Graph.lines[i].edgeEnd == vertex || Graph.lines[i].edgeEnd == vertex.father)) {
                        Graph.lines[i].strokeColor = 'red';
                        CLine_array.push(Graph.lines[i]);
                        break;
                    }
            }

            for (var j = 0; j < vertex.neighbours.length; j++) {
                if (vertex.partition == vertex.neighbours[j].partition) {
                    for (var i = 0; i < Graph.lines.length ; i++)
                        if ((Graph.lines[i].edgeStart == vertex || Graph.lines[i].edgeStart == vertex.neighbours[j]) && (Graph.lines[i].edgeEnd == vertex || Graph.lines[i].edgeEnd == vertex.neighbours[j])) {
                            Graph.lines[i].strokeColor = 'red';
                            CLine_array.push(Graph.lines[i]);
                            break;
                        }

                    for (var i = 0; i < Graph.lines.length ; i++)
                        if ((Graph.lines[i].edgeStart == start || Graph.lines[i].edgeStart == vertex.neighbours[j]) && (Graph.lines[i].edgeEnd == start || Graph.lines[i].edgeEnd == vertex.neighbours[j])) {
                            Graph.lines[i].strokeColor = 'red';
                            CLine_array.push(Graph.lines[i]);
                            break;
                        }

                    for (var i = 0; i < Graph.lines.length ; i++)
                        if ((Graph.lines[i].edgeStart == vertex.neighbours[j].father || Graph.lines[i].edgeStart == vertex.neighbours[j]) && (Graph.lines[i].edgeEnd == vertex.neighbours[j].father || Graph.lines[i].edgeEnd == vertex.neighbours[j])) {
                            if (Graph.lines[i].strokeColor.red != 1) {
                                Graph.lines[i].strokeColor = 'red';
                                CLine_array.push(Graph.lines[i]);
                            }
                            break;
                        }

                    for (var i = 0; i < CLine_array.length ; i++) {
                        var sp_c = 0;
                        var ep_c = 0;
                        if (CLine_array[i].strokeColor.red != 0) {
                            for (var j = 0; j < CLine_array.length ; j++) {
                                if (CLine_array[j].strokeColor.red != 0) {
                                    if ((CLine_array[i].edgeStart == CLine_array[j].edgeStart) || (CLine_array[i].edgeStart == CLine_array[j].edgeEnd)) sp_c++;
                                    if ((CLine_array[i].edgeEnd == CLine_array[j].edgeStart) || (CLine_array[i].edgeEnd == CLine_array[j].edgeEnd)) ep_c++;
                                }
                            }
                            if (sp_c == 1 || ep_c == 1) CLine_array[i].strokeColor = 'black';
                        }
                    }
                    return;
                }
                else {
                    if (vertex.neighbours[j].color == "white") {
                        vertex.neighbours[j].color = "gray";
                        vertex.neighbours[j].father = vertex;
                        vertex.neighbours[j].partition = 3 - vertex.partition;
                        stack.push(vertex.neighbours[j]);
                        counter = 1;
                    }
                }
            }
            if (counter == 0) {
                for (var j = CLine_array.length - 1; j > -1 ; j--) {
                    if (CLine_array[j].edgeStart != stack[stack.length - 1].father && CLine_array[j].edgeEnd != stack[stack.length - 1].father) {
                        CLine_array[j].strokeColor = 'black';
                    } else if (vertex.father != stack[stack.length - 1].father) {
                        CLine_array[j].strokeColor = 'black';
                        break;
                    } else if (vertex.father == stack[stack.length - 1].father) {
                        CLine_array[j].strokeColor = 'black';
                        break;
                    }
                }
            }
        }
    }
}
//*************************- Razdaljna particija (button) -***************************************//
D_partition_A = function () {
    clearButtons(7);
    if (Distance_part_state == false) {  // preverjanje gumba
        if (Connected(Graph) == true) {
            Dvertex_search = true;
            Distance_part_state = true;
            document.getElementById('area').value = "Izbrali ste opcijo za izris razdaljne particije.\nZ naslednjih klikom izberite začetno vozlišče!\n";
            document.getElementById('ButtonRazdaljnaParticija').style.background = 'red';
        } else window.alert("Graf ni povezan!");
    } else {
        Graph_flatten(Graph);
        if (Dvertex_search == false) {
            for (var j = 0; j < Graph.nodes.length ; j++) {
                Graph.nodes[j].construct.position = Graph.nodes[j].construct.oldPosition;
                Graph.nodes[j].construct.oldPosition = null;
                Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
                for (var i = 0; i < Graph.lines.length; i++) {
                    if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
                    else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
                }
            }
        }
        Dp_state = false;
        Dvertex_search = false;
        OldPosition_exception = true;
        Distance_part_state = false;
        document.getElementById('ButtonRazdaljnaParticija').style.background = '';
    }
}
//*************************- Razdaljna particija (glavni del) -***************************************//
D_partition_B = function (Start_V) {
    var Dqueue = new Array(); 	 // vrsta za sprehod cez graf
    var Dvertex;				// zacetno vozlisce
    for (var j = 0; j < Graph.nodes.length; j++) {  // začetne postavke za vsa vozlisca razen zacetnega
        Graph.nodes[j].construct.color = "white";//za ugotavljanje obiskanosti
        Graph.nodes[j].construct.partition = 0;// za dolocitev particije in izrisa
    }
    Start_V.color = "gray";//postavke za zacetno vozlisce
    Start_V.partition = 1;//

    Dqueue.push(Start_V); // v vrsto postavimo zacetno vozlisce

    while (Dqueue.length > 0) {  	// glavna zanka
        Dvertex = Dqueue.shift();
        for (var j = 0; j < Dvertex.neighbours.length; j++) {
            if (Dvertex.neighbours[j].color == "white") { // ce ni obiskano doloci postavke
                Dvertex.neighbours[j].color = "gray";
                Dvertex.neighbours[j].partition = Dvertex.partition + 1;
                Dqueue.push(Dvertex.neighbours[j]);
            }
        }
    }

    var max_partition = Graph.nodes[0].construct.partition; // dolocimo maksimalno particijo - premer?
    for (var j = 1; j < Graph.nodes.length; j++) {
        if (max_partition < Graph.nodes[j].construct.partition) max_partition = Graph.nodes[j].construct.partition;
    }

    var partition_positions = new Array();// tabela izracunanih koordinat za postavitev particij
    var partition_cardinality = new Array();
    for (var j = 0; j < max_partition; j++) {
        partition_positions[j] = new Point((j + 1) * 100, 100);
        partition_cardinality[j] = 0;
    }

    for (var j = 0; j < Graph.nodes.length; j++) { // premescanje vozlisc in povezav na ustrezne koordinate
        Graph.nodes[j].construct.oldPosition = Graph.nodes[j].construct.position;
        Graph.nodes[j].construct.position = partition_positions[Graph.nodes[j].construct.partition - 1];
        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        partition_positions[Graph.nodes[j].construct.partition - 1].y += 50;
        partition_cardinality[Graph.nodes[j].construct.partition - 1]++;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
    Partition_positioning(); // funkcija - izris povezav znotraj particij - krivulje
    document.getElementById('area').value += "\n" + "\n" + "Kardinalnosti i-tih soseščin:" + "\n" + "i   Kardninalnost" + "\n" + "-----------------" + "\n";
    for (var j = 0; j < partition_cardinality.length; j++) document.getElementById('area').value += (j + 1) + " -> " + partition_cardinality[j] + "\n";



}
//*********************************************-Izpisovanje pravilnosti-(button)********************************************//
Output_log = function () {
    if (output_state == false) {
        output_state = true;
        document.getElementById("button15").style.background = 'red';
    }
    else {
        output_state = false;
        document.getElementById("button15").style.background = '';
    }
}
//*******************************-Izris v ciklu ->funkcija)-************************************************//
Draw_circular = function (start) {
    var r = 150;
    var alpha = Math.PI * 2 / Math.abs(Graph.nodes.length - start);

    for (var j = start; j < Graph.nodes.length; j++) {
        var theta = alpha * (j + 1);
        Graph.nodes[j].construct.position = new Point(view.center.x + r * Math.cos(theta), view.center.y + r * Math.sin(theta));
        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
}
//*******************************-Izris GPG (->funkcija)-************************************************//
Draw_GPG = function (ind) {
    var r1 = 150;
    var r2 = 80;

    var alpha = Math.PI * 2 / ((Graph.nodes.length - ind) / 2);

    var switch_circle = ((Graph.nodes.length - ind) / 2) + ind;

    for (var j = ind; j < Graph.nodes.length; j++) {
        var theta = alpha * (j + 1);

        if (j < switch_circle) Graph.nodes[j].construct.position = new Point(view.center.x + r1 * Math.cos(theta), view.center.y + r1 * Math.sin(theta));
        else Graph.nodes[j].construct.position = new Point(view.center.x + r2 * Math.cos(theta), view.center.y + r2 * Math.sin(theta));

        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
}
//*******************************-Izris poti (funkcija)-************************************************//
Draw_inPath = function (ind, number) {
    var step = view.bounds.width / number;
    var path_point = -step + 12;
    for (var j = ind; j < Graph.nodes.length; j++) {
        Graph.nodes[j].construct.position = new Point(path_point + step, view.center.y);
        path_point += step;
        Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
        for (var i = 0; i < Graph.lines.length; i++) {
            if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
            else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
        }
    }
}
//*******************************-Zoom (buttons)-************************************************//
Zoom = function (action) {
    if (Graph_loaded == true) { // vedno pogledamo ali je že kaj na canvasu
        var zoom_test = view.zoom - 0.2; // pomozni sprem. za spremljanje zooma
        var zoom_test2 = view.zoom + 0.2;
        if (action == '-') {
            if (zoom_test > 0.2) view.zoom -= 0.2; //zoom
        } else if (zoom_test2 < 2.0) view.zoom += 0.2;
        //window.alert(view.zoom);
    }
}
//*******************************-Izris in dodajanje enega vozlisca(function)-************************************************//
Single_vertex_draw = function (v_name) {
    var coordinates = new Point;
    coordinates.x = Math.floor((Math.random() * 740) + 1);
    coordinates.y = Math.floor((Math.random() * 490) + 1);


    Graph.nodes[Graph.nodes.length] = new node();
    Graph.nodes[Graph.nodes.length - 1].construct = new Path.Circle(coordinates, 12);
    Graph.nodes[Graph.nodes.length - 1].construct.fillColor = "#00F";
    //Graph.nodes[Graph.nodes.length - 1].construct.blendMode = 'exclusion';

    Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseenter', function () {
        this.fillColor = 'red';
    });
    Graph.nodes[Graph.nodes.length - 1].construct.attach('mouseleave', function () {
        if (addingEdge == false || EdgeConstruction == false)
            this.fillColor = 'blue';
        else if (setActive) this.fillColor = 'blue';
    });

    Graph.nodes[Graph.nodes.length - 1].construct.vertex = new PointText;
    Graph.nodes[Graph.nodes.length - 1].construct.vertex.fillColor = 'white';

    Hamilton_vertex[Graph.nodes.length - 1] = 0;//

    Graph.nodes[Graph.nodes.length - 1].construct.vertex.content = v_name;
    Graph.nodes[Graph.nodes.length - 1].construct.vertex.position = Graph.nodes[Graph.nodes.length - 1].construct.position;
    Graph.nodes[Graph.nodes.length - 1].construct.neighbours = new Array();

}
//*******************************-Izris in dodajanje ene povezave(function)-************************************************//
Single_edge_draw = function (start, end) {
    start.construct.neighbours.push(end.construct);
    end.construct.neighbours.push(start.construct);

    //* Konstrukcija na canvasu - POVEZAVA*//
    Graph.lines[Graph.lines.length] = new Path.Line(start.construct.position, end.construct.position);
    Graph.lines[Graph.lines.length - 1].edgeStart = start.construct;
    Graph.lines[Graph.lines.length - 1].edgeEnd = end.construct;
    Graph.lines[Graph.lines.length - 1].strokeColor = 'black';
    Graph.lines[Graph.lines.length - 1].strokeWidth = 4;

    for (var i = 0; i < Graph.lines.length; i++) { 				// postavitev crt pod vozlisca, layer nizje
        project.activeLayer.insertChild(0, Graph.lines[i]);
    }
}
//*******************************-Nariši cirkulant izbrane dolžine (button)-************************************************//
Draw_Circulant = function () {
    clearButtons(0);
    var v_number = 0;
    var k_number = new Array();
    var z_number = 0;
    do {
        v_number = prompt("Vnesi n =", "");
        if (v_number == null) { document.getElementById('area').value = "Dejanje je bilo preklicano!"; return; }
        v_number = parseInt(v_number);
    } while (v_number < 1 || v_number > 40 || isNaN(v_number));
    document.getElementById('area').value = "Circ(" + v_number + ", S) \n";
    document.getElementById('area').value += "Sledi naštevanje elementov množice S. Naštevanje končamo z vnosom -1.\n";
    do {
        do {
            z_number = prompt("Vnesi k =", "");
            if (z_number == null) { document.getElementById('area').value = "Dejanje je bilo preklicano!"; return; }
            z_number = parseInt(z_number);
        } while (z_number < -1 || isNaN(z_number) || z_number >= v_number);
        if (z_number != -1) k_number.push(z_number);
        document.getElementById('area').value = "Circ(" + v_number + ", S) \n";
        document.getElementById('area').value += "Sledi naštevanje elementov množice S. Naštevanje končamo z vnosom -1.\n";
        document.getElementById('area').value += "S = {";
        for (var i = 0; i < k_number.length ; i++) {
            if (i == 0) document.getElementById('area').value += "+-" + k_number[i];
            else document.getElementById('area').value += " , +-" + k_number[i];
        }
        document.getElementById('area').value += "}";
    } while (z_number != -1);

    if (Graph_loaded) {
        var ind = Graph.nodes.length;
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }

        var sub_v = ind;

        for (var i = 0; i < k_number.length ; i++) {
            if (k_number[i] != 0) {
                var sub_ind;
                if ((v_number - k_number[i]) != k_number[i]) sub_ind = Graph.nodes.length;
                else sub_ind = Graph.nodes.length - (v_number / 2);
                for (var j = sub_v; j < sub_ind; j++) {
                    if (Graph.nodes[j].construct.neighbours.indexOf(Graph.nodes[((j + (k_number[i] % (v_number)) - ind) % v_number) + ind].construct) == -1) Single_edge_draw(Graph.nodes[j], Graph.nodes[((j + (k_number[i] % (v_number)) - ind) % v_number) + ind]);
                }
            }
        }

        document.getElementById('area').value = "Circ(" + v_number + ", {" + k_number + "}) je narisan!";
        Draw_circular(ind);

    } else {
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        Graph_loaded = true;

        var sub_v = 0;

        for (var i = 0; i < k_number.length ; i++) {
            if (k_number[i] != 0) {
                var sub_ind;
                if ((v_number - k_number[i]) != k_number[i]) sub_ind = Graph.nodes.length;
                else sub_ind = Graph.nodes.length - (v_number / 2);
                for (var j = sub_v; j < sub_ind; j++) {
                    if (Graph.nodes[j].construct.neighbours.indexOf(Graph.nodes[((j + (k_number[i] % (v_number))) % v_number)].construct) == -1) Single_edge_draw(Graph.nodes[j], Graph.nodes[((j + (k_number[i] % (v_number))) % v_number)]);
                }
            }
        }

        document.getElementById('area').value = "Circ(" + v_number + ", {" + k_number + "}) je narisan!";
        Draw_circular(0);
    }

}
//*******************************-Nariši cikel izbrane dolžine (button)-************************************************//
Draw_cycle = function () {
    clearButtons(0);
    var v_number = 0;
    do {
        v_number = prompt("Vnesi dolžino cikla!", "");
        if (v_number == null) return;
        v_number = parseInt(v_number);
    } while (v_number < 3 || v_number > 40 || isNaN(v_number));
    if (Graph_loaded) {
        var ind = Graph.nodes.length;
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }

        for (var j = ind; j < (Graph.nodes.length - 1) ; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[j + 1]);
        Single_edge_draw(Graph.nodes[ind], Graph.nodes[Graph.nodes.length - 1]);
        document.getElementById('area').value = "Cikel C(" + v_number + ") je narisan!";
        Draw_circular(ind);
    } else {
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        Graph_loaded = true;

        for (var j = 0; j < (Graph.nodes.length - 1) ; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[j + 1]);
        Single_edge_draw(Graph.nodes[0], Graph.nodes[Graph.nodes.length - 1]);
        document.getElementById('area').value = "Cikel C(" + v_number + ") je narisan!";
        Draw_circular(0);
    }
}
//*******************************-Nariši poln graf (button)-************************************************//
Draw_complete = function () {
    clearButtons(0);
    var v_number = 0;
    do {
        v_number = prompt("Vnesi število vozlišč polnega grafa!", "");
        if (v_number == null) return;
        v_number = parseInt(v_number);
    } while (v_number < 3 || v_number > 40 || isNaN(v_number));
    if (Graph_loaded) {
        var ind = Graph.nodes.length;
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }

        for (var j = ind; j < (Graph.nodes.length - 1) ; j++)
            for (var i = (j + 1) ; i < (Graph.nodes.length) ; i++) Single_edge_draw(Graph.nodes[j], Graph.nodes[i]);

        document.getElementById('area').value = "Poln graf K(" + v_number + ") je narisan!";
        Draw_circular(ind);
    } else {
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        Graph_loaded = true;

        for (var j = 0; j < (Graph.nodes.length - 1) ; j++)
            for (var i = (j + 1) ; i < (Graph.nodes.length) ; i++) Single_edge_draw(Graph.nodes[j], Graph.nodes[i]);

        document.getElementById('area').value = "Poln graf K(" + v_number + ") je narisan!";
        Draw_circular(0);
    }
}
//*******************************-Nariši GPG(button)-************************************************//
Draw_petersen = function () {
    clearButtons(0);
    var v_number = 0;
    var k_number = 0;
    do {
        v_number = prompt("Vnesi n =", "");
        if (v_number == null) return;
        v_number = parseInt(v_number);
    } while (v_number < 3 || v_number > 40 || isNaN(v_number));

    do {
        k_number = prompt("Vnesi k =", "");
        if (k_number == null) return;
        k_number = parseInt(k_number);
    } while (k_number < 1 || k_number == v_number || isNaN(k_number));

    if (Graph_loaded) {
        var ind = Graph.nodes.length;
        for (var j = 1; j <= (2 * v_number) ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }

        for (var j = ind; j < (ind + v_number - 1) ; j++) {
            Single_edge_draw(Graph.nodes[j], Graph.nodes[(j + 1)]);
            Single_edge_draw(Graph.nodes[j], Graph.nodes[j + v_number]);
        }
        Single_edge_draw(Graph.nodes[ind], Graph.nodes[ind + v_number - 1]);
        Single_edge_draw(Graph.nodes[ind + v_number - 1], Graph.nodes[ind - 1 + 2 * v_number]);

        var sub_v = v_number + ind;
        var sub_ind;
        if ((v_number - k_number) != k_number) sub_ind = Graph.nodes.length;
        else sub_ind = Graph.nodes.length - (v_number / 2);

        for (var j = sub_v; j < sub_ind; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[((j + (k_number % (v_number)) - ind) % v_number) + v_number + ind]);

        document.getElementById('area').value = "GPG(" + v_number + "," + k_number + ") je narisan!";
        Draw_GPG(ind);
    } else {
        for (var j = 1; j <= (2 * v_number) ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        Graph_loaded = true;

        for (var j = 0; j < (Graph.nodes.length / 2) ; j++) {
            Single_edge_draw(Graph.nodes[j], Graph.nodes[(j + 1) % v_number]);
            Single_edge_draw(Graph.nodes[j], Graph.nodes[j + v_number]);
        }
        var sub_v = Graph.nodes.length / 2;
        var sub_ind;
        if ((v_number - k_number) != k_number) sub_ind = Graph.nodes.length;
        else sub_ind = Graph.nodes.length - (v_number / 2);

        for (var j = sub_v; j < sub_ind; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[((j + (k_number % (v_number))) % v_number) + v_number]);

        document.getElementById('area').value = "GPG(" + v_number + "," + k_number + ") je narisan!";
        Draw_GPG(0);
    }
}
//*******************************-Nariši Pot(button)-************************************************//
Draw_gpath = function () {
    clearButtons(0);
    var v_number = 100;
    do {
        v_number = prompt("Vnesi dolžino poti!", "");
        if (v_number == null) return;
        v_number = parseInt(v_number);
    } while (v_number < 1 || v_number > 40 || isNaN(v_number));
    v_number++;
    if (Graph_loaded) {
        var ind = Graph.nodes.length;
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        for (var j = ind; j < (Graph.nodes.length - 1) ; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[(j + 1)]);

        document.getElementById('area').value = "Pot P(" + (v_number - 1) + ") je narisana!";
        Draw_inPath(ind, v_number);
    } else {
        for (var j = 1; j <= v_number ; j++) {
            var content_input = 0;
            do {
                content_input++;
            } while (content_check(content_input) == false);
            Single_vertex_draw(content_input);
        }
        for (var j = 0; j < (Graph.nodes.length - 1) ; j++) Single_edge_draw(Graph.nodes[j], Graph.nodes[(j + 1)]);

        Graph_loaded = true;
        document.getElementById('area').value = "Pot P(" + (v_number - 1) + ") je narisana!";
        Draw_inPath(0, v_number);
    }
}
//*******************************-Preimenuj vozlisce(button)-************************************************//
addContent = function () {
    if (addingContent == false && Dp_state == false && Graph_loaded == true) {
        clearButtons(5);
        addingContent = true;
        document.getElementById("ButtonRename").style.background = 'red';
    }
    else if (Dp_state == false && Hamilton_search == false) {
        addingContent = false;
        document.getElementById("ButtonRename").style.background = '';
    }
}
//*************************- Avtomorfizem (button) -************************************//
Aut = function () {
    if (Graph_loaded) {
        if (Aut_search == false) {
            Aut_search = true;
            clearButtons(6);
            document.getElementById('area').value = "Izbrana je opcija za iskanje avtomorfizma.\nAvtomorfizem iščemo tako, da prvo izberemo vozlišče, ki ga želimo preslikati. Ko to naredimo izberemo še vozlišče v katerega naj se preslika prej izbrano vozlišče.\nTako preslikamo vsa vozlišča danega grafa. V primeru, da vozlišče želimo preslikati drugam, ga enostavno ponovno preslikamo v neko drugo vozlišče.\n";
            document.getElementById("ButtonAut").style.background = 'red';
            for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.image = 0;
            document.getElementById('area').value += "\nVozlišča, ki še niso preslikana, so sledeča: ";
            for (var i = 0; i < Graph.nodes.length; i++)
                if (Graph.nodes[i].construct.image == 0) document.getElementById('area').value += Graph.nodes[i].construct.vertex.content + "  ";
        } else {
            Aut_search = false;
            if (VertexFrom != null) {
                VertexFrom.fillColor = 'blue';
                VertexFrom.attach('mouseleave', function () {
                    this.fillColor = 'blue';
                });
            }
            VertexTo = null;
            VertexFrom = null;
            document.getElementById('area').value = "Iskanje avtomorfizma izključeno.";
            document.getElementById("ButtonAut").style.background = '';
        }
    }
}
//*************************- Izklkjucevanje -(glob.function) -************************************//
clearButtons = function (choice) {
    if (choice != 1) {
        addingEdge = false;
        EdgeConstruction = false;
        if (setActive == true) {
            startingPoint.fillColor = 'blue';
            startingPoint.attach('mouseleave', function () {
                this.fillColor = 'blue';
            });
            setActive = false;
        }
        document.getElementById("ButtonNewEdge").style.background = '';
    }
    if (choice != 2) {
        addingVertex = false;
        document.getElementById("ButtonNewVertex").style.background = '';
    }
    if (choice != 3 && choice != 7) {
        graph_coloring = false;
        document.getElementById("ButtonColorGraph").style.background = '';
        document.getElementById("button5").style.visibility = 'hidden';
        document.getElementById("button6").style.visibility = 'hidden';
        document.getElementById("button7").style.visibility = 'hidden';
        document.getElementById("button8").style.visibility = 'hidden';
        document.getElementById("button9").style.visibility = 'hidden';
        document.getElementById("button10").style.visibility = 'hidden';
        document.getElementById("button11").style.visibility = 'hidden';
        document.getElementById("button12").style.visibility = 'hidden';
        document.getElementById("button21").style.visibility = 'hidden';
        document.getElementById("button22").style.visibility = 'hidden';
        for (var j = 0; j < Graph.nodes.length; j++) {
            Graph.nodes[j].construct.fillColor = "#00F";
            //Graph.nodes[j].construct.blendMode = "exclusion";
            Graph.nodes[j].construct.attach('mouseleave', function () {
                this.fillColor = "#00F";
            });
            Graph.nodes[j].construct.attach('mouseenter', function () {
                this.fillColor = 'red';
            });
        }
    }
    if (choice != 4 && choice != 7) {
        Hamilton_edge.length = 0;
        Hamilton_search = false;
        document.getElementById("ButtonHamilton").style.background = '';
        //for (var j = 0; j < Graph.nodes.length; j++) Graph.nodes[j].construct.blendMode = "exclusion"; // ponovna vkljucitev po izklopu
        for (var j = 0; j < Graph.lines.length; j++) Graph.lines[j].strokeColor = 'black'; // umaknemo izbrane - barvane povezave
        for (var i = 0; i < Hamilton_vertex.length; i++) Hamilton_vertex[i] = 0; // vrnemo privzete vrednosti v glavno Hamilton-tabelo
    }
    if (choice != 5) {
        addingContent = false;
        document.getElementById("ButtonRename").style.background = '';
    }
    if (choice != 6 && choice != 7) {
        Aut_search = false;
        if (VertexFrom != null) {
            VertexFrom.fillColor = 'blue';
            VertexFrom.attach('mouseleave', function () {
                this.fillColor = 'blue';
            });
        }
        VertexTo = null;
        VertexFrom = null;
        document.getElementById("ButtonAut").style.background = '';
    }

    if (choice == 0 && OldPosition_exception != true) {
        Graph_flatten(Graph);
        if (Dvertex_search == false) {
            for (var j = 0; j < Graph.nodes.length ; j++) {
                Graph.nodes[j].construct.position = Graph.nodes[j].construct.oldPosition;
                Graph.nodes[j].construct.oldPosition = null;
                Graph.nodes[j].construct.vertex.position = Graph.nodes[j].construct.position;
                for (var i = 0; i < Graph.lines.length; i++) {
                    if (Graph.lines[i].edgeEnd.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].lastSegment.point = Graph.nodes[j].construct.position;
                    else if (Graph.lines[i].edgeStart.vertex.content == Graph.nodes[j].construct.vertex.content) Graph.lines[i].firstSegment.point = Graph.nodes[j].construct.position;
                }
            }
        }
        Dp_state = false;
        OldPosition_exception = true;
        Distance_part_state = false;
        Dvertex_search = false;
        document.getElementById('ButtonRazdaljnaParticija').style.background = '';
    }
    //ozina_premer_grafa = false;
}

onLoad = function () {
    document.getElementById('fileinput').click();
}



//*************************- Izpis zaporedja stopenj -************************************//
// Funkcija za izračun in prikaz zaporedja stopenj grafa
ZaporedjeStopenj = function (silent) {
    if (Graph_loaded) {
        // Inicializiramo tabelo, ki bo vsabova stopnje vozlišč
        var zapoStopenj = new Array();
        // Shranimo si število sosedov posameznega vozlišča
        for (var i = 0; i < Graph.nodes.length; i++) {
            zapoStopenj.push(Graph.nodes[i].construct.neighbours.length);
        }
        // Sortiramo seznam od največjega do najmanjšega elementa
        zapoStopenj = zapoStopenj.sort(function (a, b) { return b - a; });
        // Inicializiramo niz za prikaz uporabniku
        var zaporedjeText = new String("");
        // V niz nanizamo zaporedje stopenj, ločena z vejicami
        for (var i = 0; i < Graph.nodes.length; i++) {
            if (zaporedjeText != "") {
                zaporedjeText += ", ";
            }
            zaporedjeText += zapoStopenj[i];
        }
        // Prikažemo zaporedje stopenj uporabniku
        if (silent === true) {
            return zapoStopenj
        }
        else {
            document.getElementById('area').value = "Zaporedje stopenj: (" + zaporedjeText + ").";
        }
        
    }
}

ColorAllLinesBlack = function () {
    for (var i = 0; i < Graph.lines.length; i++) {
        Graph.lines[i].strokeColor = 'black';
    }
}

OzinaGrafaToggle = function () {
    if (!Graph_loaded) {
        document.getElementById("ButtonOzina").style.background = "";
        return;
    }
    if (document.getElementById("ButtonPremer").style.background == 'red') {
        document.getElementById("ButtonPremer").style.background = ''
        ColorAllLinesBlack();
    }
    if (document.getElementById("ButtonOzina").style.background == '') {
        OzinaGrafa();
        document.getElementById("ButtonOzina").style.background = "red";
    }
    else {
        ColorAllLinesBlack();
        document.getElementById("ButtonOzina").style.background = "";
    }
}

OzinaGrafa = function () {
    if (Graph_loaded) {
        // We set the blend mode back and colors to what they were
        //for (var i = 0; i < Graph.nodes.length ; i++) Graph.nodes[i].construct.blendMode = 'exclusion';
        for (var i = 0; i < Graph.lines.length; i++) {
            Graph.lines[i].strokeColor = 'black';
        }

        // Initialize all variables
        // Holds the current found girth of the graph
        var girthOfG = Infinity;
        // Holds all vertices   example: vertices = [1,2,3,4], vertices[0] = 1
        var vertices = new Array();
        // Holds the neighbours of the vertices (2D array)  example: neighbours = [[2,3],[1,3],[1,2],[2]], neigbours[1] = [2,3]
        var neighbours = new Array();
        // Holds all parents of vertices for our BFS algorithm  example: parent = [null, 1, 1, 2], parent[4] = 1
        var parent = new Array();
        // Holds the distance of nodes to the root of the tree  example: distance = [0, 1, 1, 2], distance[4] = 2
        var distance = new Array();
        // Holds the vertices of the currently smallest found cycle
        var smallestCycle = new Array();

        // Here we translate the graph from our structure to a more convenient one
        for (var i = 0; i < Graph.nodes.length; i++) {  // Iterate over all vertices
            vertices.push(Graph.nodes[i].construct.vertex.content); // Store vertex
            neighbours[vertices[i]] = new Array();                  // Initialize neigbours Array
            for (var j = 0; j < Graph.nodes[i].construct.neighbours.length; j++) {  //Iterate over all neigbours of the current vertex
                neighbours[vertices[i]].push(Graph.nodes[i].construct.neighbours[j].vertex.content);    // Store the neighbours
            }
        }
        var S = new Array();
        var R = new Array();

        // Begin the algorithm
        // Iterate over all vertices of the graph
        Object.keys(vertices).forEach(function (key, index) {
            // v is our root node of this breadth-first-search graph
            var v = this[key];
            distance[v] = 0;    // Distance from root is therefore 0
            parent[v] = null;   // And it has no parent

            // If R doesn't already contain v, we add it
            if (R.indexOf(v) === -1) {
                R.push(v);
            }
            S = []; //Empty S
            // While R is not empty
            while (R.length > 0) {
                var x = R.shift(); // Take element from queue R (removes it)

                // If S doesn't contain x we add it
                if (S.indexOf(x) === -1) {
                    S.push(x);
                }

                // Iterate over all neighbours of x
                Object.keys(neighbours[x]).forEach(function (keyN, index) {
                    // y is the current neighbour
                    var y = this[keyN];
                    if (parent[x] !== y) { // y is only valid node if it isn't the parent of x
                        if (S.indexOf(y) === -1) {  // If S doesn't already contain y
                            parent[y] = x;  // Set the parent of y to x
                            distance[y] = distance[x] + 1;  // Set the distance of node y to the distance of its parent plus one
                            if (R.indexOf(y) === -1) {  // If R doesn't contain y, add it to it
                                R.push(y);
                            }
                        }
                            // We have already reached y at some point (a cycle is indicated)
                        else {
                            // We can check if the lenght of the cycle is less than the current girth of the graph
                            if (girthOfG > distance[x] + distance[y] + 1) {
                                // We save the girth if we found a smaller one
                                girthOfG = distance[x] + distance[y] + 1;

                                // Temporary variables for holding the values of parents
                                var xP = x;
                                var yP = y;
                                // We empty the current smalles cycle
                                smallestCycle = [];
                                // We add parents of x
                                while (xP !== null) {
                                    smallestCycle.push(xP);
                                    xP = parent[xP];
                                }
                                // We add parents of y
                                while (yP !== null) {
                                    smallestCycle.unshift(yP);
                                    yP = parent[yP];
                                }
                            }
                        }
                    }
                }, neighbours[x]);
            }
        }, vertices);
        if (girthOfG === Infinity) {
            document.getElementById('area').value = "Graf nima nobenega cikla. Njegova ožina je zato enaka neskončno.";
        }
        else {
            document.getElementById('area').value = "Ožina grafa je enaka " + girthOfG + ".";

            // We set the blend mode, so that the nodes and lines do not overlap
            //for (var i = 0; i < Graph.nodes.length ; i++) Graph.nodes[i].construct.blendMode = 'normal';
            // Reset the color
            for (var i = 0; i < Graph.lines.length; i++) {
                Graph.lines[i].strokeColor = 'black';
            }
            // We iterate over all edges and find those that are part of the smallest cycle and color them
            for (var i = 0; i < Graph.lines.length; i++) {
                for (var j = 0; j < smallestCycle.length - 1; j++) {
                    var pA = Graph.lines[i].edgeStart.vertex.content;
                    var pB = Graph.lines[i].edgeEnd.vertex.content
                    if ((smallestCycle[j] === pA && smallestCycle[j + 1] === pB)
                        || (smallestCycle[j] === pB && smallestCycle[j + 1] === pA)) {
                        Graph.lines[i].strokeColor = 'red';
                        break;
                    }
                }
            }
            //ozina_premer_grafa = true;
        }
    }
}

PremerGrafaToggle = function () {
    if (!Graph_loaded) {
        document.getElementById("ButtonPremer").style.background = "";
        return;
    }
    if (document.getElementById("ButtonOzina").style.background == 'red') {
        document.getElementById("ButtonOzina").style.background = ''
        ColorAllLinesBlack();
    }
    if (document.getElementById("ButtonPremer").style.background == '') {
        PremerGrafa();
        document.getElementById("ButtonPremer").style.background = "red";
    }
    else {
        ColorAllLinesBlack();
        document.getElementById("ButtonPremer").style.background = "";
    }
}

PremerGrafa = function () {
    if (Graph_loaded) {
        if (Connected(Graph)) {
            // Number of vertices
            var Vno = Graph.nodes.length;
            // Initialize adjacency matrix
            var adjMatrix = new Array(Vno);
            for (var i = 0; i < Vno; i++) {
                adjMatrix[i] = new Array(Vno);
            }
            for (var i = 0; i < Vno; i++) {
                for (var j = 0; j < Vno; j++) {
                    adjMatrix[i][j] = Infinity;
                }
            }

            // Here we translate the graph from our structure to an adjecency matrix
            for (var i = 0; i < Graph.nodes.length; i++) {  // Iterate over all vertices
                var node = Graph.nodes[i].construct.vertex.content;
                for (var ne = 0; ne < Graph.nodes[i].construct.neighbours.length; ne++) { // Iterate over all neighbours
                    var neighbour = Graph.nodes[i].construct.neighbours[ne].vertex.content;
                    for (var j = 0; j < Graph.nodes.length; j++) { // Iterate over all vertices to find the neighbour index in the graph
                        var newNode = Graph.nodes[j].construct.vertex.content;
                        if (newNode == neighbour) {
                            // Because graph is undirected, the adjacency matrix will be symetrical
                            adjMatrix[i][j] = 1;
                            adjMatrix[j][i] = 1;
                            break;
                        }

                    }
                }
            }
            // The object that will hold the longest shortest path found
            var longestShortestPath = {
                length: 0,
                start: 0,
                end: 0,
                paths: null
            };
            // We iterate over all vertices of the graph
            for (var i = 0; i < Graph.nodes.length; i++) {
                // We use the Dijkstras algorithm, to find the shortest paths from current vertex
                var shortestPaths = shortestPath(adjMatrix, Graph.nodes.length, i);
                // We iterate over all shortest paths to find the longest one
                for (var j = 0; j < shortestPaths.pathLengths.length; j++) {
                    if (shortestPaths.pathLengths[j] > longestShortestPath.length) {
                        // We save it and all the data needed to reconcstruct the path later on
                        longestShortestPath.length = shortestPaths.pathLengths[j];
                        longestShortestPath.start = shortestPaths.startVertex;
                        longestShortestPath.end = j;
                        longestShortestPath.paths = shortestPaths;
                    }
                }
            }
            // Construct the path from the data we saved during our algorithm
            var path = constructPath(longestShortestPath.paths, longestShortestPath.end);
            // Notify the user of our findings
            path.unshift(longestShortestPath.start);
            document.getElementById('area').value = "Premer grafa je enak " + longestShortestPath.length + ".";


            // We set the blend mode, so that the nodes and lines do not overlap
            //for (var i = 0; i < Graph.nodes.length ; i++) Graph.nodes[i].construct.blendMode = 'normal';
            // Reset the color
            for (var i = 0; i < Graph.lines.length; i++) {
                Graph.lines[i].strokeColor = 'black';
            }
            // We iterate over all edges and find those that are part of the longest shortest path and color them
            for (var i = 0; i < Graph.lines.length; i++) {
                for (var j = 0; j < path.length - 1; j++) {
                    var pA = Graph.lines[i].edgeStart.vertex.content;
                    var pB = Graph.lines[i].edgeEnd.vertex.content
                    if ((Graph.nodes[path[j]].construct.vertex.content === pA && Graph.nodes[path[j+1]].construct.vertex.content === pB)
                        || (Graph.nodes[path[j]].construct.vertex.content === pB && Graph.nodes[path[j+1]].construct.vertex.content === pA)) {
                        Graph.lines[i].strokeColor = 'red';
                        break;
                    }
                }
            }
            //ozina_premer_grafa = true;
        }
        else {
            document.getElementById('area').value = "Graf ni povezan, zato je njegov premer enak neskončno.";
        }
    }
}

ShraniGrafKotSliko = function () {
    if (!Graph_loaded) {
        alert("Na kanvasu ni nobenega grafa. Najprej ustvari graf, nato pa se ga lahko shrani s to funkcijo.");
    }
    else {
        var canvas = document.getElementById("myCanvas");
        var image = canvas.toDataURL();
        var link = document.createElement('a');
        link.download = 'moj_graf.png';
        link.href = image;
        link.click();
    }
}

IzrekPosa = function () {
    if (Graph_loaded) {
        if (Graph.nodes.length < 3) {
            document.getElementById('area').value = "Graf ima manj kot tri vozlišča. Ne morem preveriti veljavnosti Posejevega izreka.";
            return;
        }       
        // Pridobimo zaporedje stopenj
        var zaporedjeStopenj = ZaporedjeStopenj(true);
        // Ga obrnemo, tako da je najmanjše število na začetku (npr [2,4,5])
        zaporedjeStopenj.reverse();
        // Spremenljivka v kateri hranimo stevilo vozlisc, katerih stopnja je najvec k
        var steviloVozlisc = 0;
        // Spremeljivka, ki nam na koncu algoritma pove ali graf zadosca osnovnemu pogoju izreka
        var zadostuje = true;
        // Sprehodimo se cez vse k
        for (var k = 1; k < (zaporedjeStopenj.length - 1) / 2; k++) {
            // Ker imajo tabele tu nicelni indeks, od k odstejemo 1
            // Ce najdemo kako tako vozlisce na k-tem mestu v tabeli, to pomeni da je vsaj k vozlisc stopnje manj ali enako k
            if (zaporedjeStopenj[k - 1] <= k) {
                // Graf ne zadostuje osnovnemu pogoju
                zadostuje = false;
                break;
            }
        }

        if (zadostuje) {
            document.getElementById('area').value += "Graf zadošča osnovnemu pogoju izreka Posa!";
            // Preverimo ali gre za graf z liho stopnjo
            if (Graph.nodes.length % 2 === 1) {
                document.getElementById('area').value += "\nTa graf ima liho število vozlišč, zato mora zadoščati tudi dodatnemu pogoju izreka Posa."
                steviloVozlisc = 0;
                // Se sprehodimo cez vozlisca grafa in prestejemo vozlisca, ki ustrezajo pogoju
                for (var i = 0; i < Graph.nodes.length; i++) {
                    if (Graph.nodes[i].construct.neighbours.length <= (Graph.nodes.length - 1) / 2) {
                        steviloVozlisc += 1;
                    }
                }
                // Obvestimo uporabnika o izpolnitvi
                if (steviloVozlisc <= (Graph.nodes.length - 1) / 2) {
                    document.getElementById('area').value += "\nGraf zadošča dodatnemu pogoju izreka Posa.";
                    document.getElementById('area').value += "\nGraf zadošča vsem pogojem izreka Posa!";
                }
                else {
                    document.getElementById('area').value += "\nGraf NE zadošča dodatnemu pogoju izreka Posa.";
                    document.getElementById('area').value += "\nGraf NE zadošča vsem pogojem izreka Posa!";
                    zadostuje = false;
                }
            }
        }
        else {
            document.getElementById('area').value += "Graf NE zadošča osnovnemu pogoju izreka Posa!";
            return;
        }
    }
}

IzrekDirac = function () {
    if (Graph_loaded) {
        if (Graph.nodes.length < 3) {
            document.getElementById('area').value = "Graf ima manj kot tri vozlišča. Ne morem preveriti veljavnosti Diracovega izreka.";
            return;
        }
        //var zadostuje = true;

        var zaporedjeStopenj = ZaporedjeStopenj(true);
        zaporedjeStopenj.reverse();

        //for (var i = 0; i < zaporedjeStopenj.length; i++) {
        //    if (zaporedjeStopenj[i] < zaporedjeStopenj.length / 2) {
        //        zadostuje = false;
        //        break;
        //    }
        //}
        if (zaporedjeStopenj[0] >= zaporedjeStopenj.length/2) {
            document.getElementById('area').value += "\nGraf zadošča pogojem Diracovega izreka.";
        }
        else {
            document.getElementById('area').value += "\nGraf NE zadošča pogojem Diracovega izreka.";
        }
    }
}

IzrekOrej = function () {
    if (Graph_loaded) {
        if (Graph.nodes.length < 3) {
            document.getElementById('area').value = "Graf ima manj kot tri vozlišča. Ne morem preveriti veljavnosti Diracovega izreka.";
            return;
        }
        var pregledani = new Array();
        var vozlisca = new Array();
        var sosedi = new Array();

        for (var i = 0; i < Graph.nodes.length; i++) {
            vozlisca.push(Graph.nodes[i].construct.vertex.content);
            sosedi[vozlisca[i]] = new Array();
            for (var j = 0; j < Graph.nodes[i].construct.neighbours.length; j++) {
                sosedi[vozlisca[i]].push(Graph.nodes[i].construct.neighbours[j].vertex.content);
            }
        }
        //document.getElementById('area').value += "Vsota poljubnega para nesosednjih vozlišč mora biti večja ali enaka stopnji grafa, tedaj graf premore Hamiltonov cikel.";
        var zadosca = true;
        // Gremo cez vsa vozlisca grafa
        for (var i = 0; i < vozlisca.length; i++) {
            var A = vozlisca[i];
            // In nato se enkrat cez vsa vozlisca grafa
            for (var j = 0; j < vozlisca.length; j++) {
                var B = vozlisca[j];
                // Preverimo, da ne gre za isto vozlisce, da tocke B nismo ze pregledali in da A in B nista sosednji vozlisci
                if (A !== B && pregledani.indexOf(B) === -1 && sosedi[A].indexOf(B) === -1) {
                    //document.getElementById('area').value += "\nVozlišči " + A + " in " + B + " imata vsoto stopenj";
                    // Če vsota stopenj vozlisc A in B enaka ali vecja od stopnje grafa, potem graf ne zadosca pogojem Orejevega izreka
                    if (sosedi[A].length + sosedi[B].length < vozlisca.length) {
                        //document.getElementById('area').value += " manjšo od stopnje grafa. NI OK!";
                        zadosca = false;
                    }
                    else {
                        //document.getElementById('area').value += " večjo ali enako stopnji grafa. OK!";
                    }
                }
            }
            // Shranimo si ze pregledana vozlisca
            pregledani.push(A);
        }
        if (zadosca) {
            document.getElementById('area').value += "\nGraf zadošča pogojem Orejevega izreka!";
        }
        else {
            document.getElementById('area').value += "\nGraf NE zadošča pogojem Orejevega izreka!";
        }
    }
}

IzrekPosaDiraOrej = function () {
    if (Graph_loaded) {
        if (Graph.nodes.length < 3) {
            document.getElementById('area').value = "Graf ima manj kot tri vozlišča. Ne morem preveriti veljavnosti teh treh izrekov.";
            return;
        }
        document.getElementById('area').value = "";
        IzrekPosa();
        IzrekDirac();
        IzrekOrej();
    }
}