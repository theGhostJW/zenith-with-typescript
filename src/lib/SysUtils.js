// @flow

import * as _ from 'lodash';

export const ARRAY_QUERY_ITEM_LABEL = '[Array Query Item]';

function setParts(arLeftSet, arRightSet){

  function intersect(ar1, ar2){
    var inIntersection = [],
        uniqueToFirst = [];

    function isInar2(item){
      function equalsTarg(ar2Item){
        return areEqual(ar2Item, item);
      }
      return _.find(ar2, equalsTarg)
    }

    function clasify(ar1Item){
      var pushTo = isInar2(ar1Item) ? inIntersection : uniqueToFirst;
      pushTo.push(ar1Item);
    }

    _.each(ar1, clasify);
    return [uniqueToFirst, inIntersection];
  }

  var leftCommon = intersect(arLeftSet, arRightSet),
      rightCommon = intersect(arRightSet, arLeftSet);


  return [leftCommon[0], leftCommon[1], rightCommon[0]];
}

export function reorderProps(obj: {}, ...rest: Array<string>): {} {
  var result: {} = _.chain(obj)
                              .pick(...rest)
                              .defaults(obj)
                              .value();
  return result;
}

export function fillArray(arrayLength: number, val: any): Array<any> {
  return _.times(arrayLength, _.constant(val));
}
