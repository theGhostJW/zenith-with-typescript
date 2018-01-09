# Powershell

  1. https://www.howtogeek.com/126469/how-to-create-a-powershell-profile/
      * replace with Microsoft.PowerShell_profile.ps1 in <runtimeFiles>
  1. https://serverfault.com/questions/31194/how-do-i-change-my-default-powershell-profile-digitially-sign-my-profile-file

# Lodash
    1. use es6 where possible - start with - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    1. different functions - https://github.com/lodash/lodash/wiki/Migrating


# flow
https://github.com/facebook/nuclide/issues/321
zsol commented on Sep 17, 2016

@subtleGradient this is probably because flow is either not on your path, or it's found multiple times. Try running where.exe flow in a cmd/powershell (.exe is important for the latter) and manually copy one of the paths into nuclide settings. I'm working on a PR to fix this

# bluebird flow-typed workaround
  * https://github.com/flowtype/flow-typed/issues/1272

# Lodash flow-typed work Workaround
  * add this to the top of the lodash_.. flowTyped file if getting imports warning in diagnostics
