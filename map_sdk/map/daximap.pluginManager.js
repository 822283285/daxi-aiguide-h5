(function(global){
    var daximap = global["DaxiMap"] = global["DaxiMap"] || {};
    var DXPluginManager = function(){
        this._pluginMap = {};
    }

    var proto = DXPluginManager.prototype;

    proto["register"] = function(name, plugin){
        this._pluginMap[name] = plugin;
    }

    proto["getPlugin"] = function (name){
        return this._pluginMap[name];
    }
    daximap["PluginManager"] = new DXPluginManager();
})(window);
