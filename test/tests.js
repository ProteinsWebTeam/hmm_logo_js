global.jQuery  = global.$ = require("jquery");

var chai        = require('chai'),
    ActiveSitesAdder   = require("../src/ActiveSitesAdder.js");

chai.should();

describe('the alignment class', function() {
    describe('trying with family PF02171', function () {
        var number_shuffled_hits=1;
        it('should calculate the sequence coordinate from a cigar for F4HKC1', function () {
            var x = new ActiveSitesAdder({
                sequence:"MIAEIIREIGIEGARYMEENVDEQFKALKYLSSSIDTEMFIKLVIANSLVSYQLTGKGEGWWWEFAKYFSKVRVQGIYDAYSKFLPRSRFNRRLVQQKLSRIKKIEHFLNSLTLDELRGYYDDMITFWNLIARTLNVDKRSKTIVFAVKMFGYSARIAFSEFRPYPMEIPIPEDVRIIKVTSRLTREKPQVFWQKIARKSGVPPLHIDSILWPLIGGTKVDSAPEWLREKLLTLQRIINK",
                cigar:"38IMD34MD14I21MIMIMI9M11I4M2I3M10I7MI22M2I2M2IMIM2I6MI4M3I2M3I2M3I45MI14M4D3IDIDI2D3I8D4M7I10M5I4M5IM4I2M2I22M9D8M8I",
                sequence_start:3,
                number_shuffled_hits:number_shuffled_hits
            });

            for (var i=1;i< x.sequence.length;i++) {
                var col = x.getColumnFromResidue(i);
                if (col > 0 ) {
                    x.sequence[i-1].should.equal(x.alignment[col-1+number_shuffled_hits]);
                }
            }
        });
        it('should calculate the sequence coordinate from a cigar for M0P0Z1', function () {
            var x = new ActiveSitesAdder({
                sequence:"MDENTLSPNRVEQVSGAITELGYSGIVKFDETEPEYEFLTSVVDEFESDRHLALLSILAATQDYQLAGDAQKFWQTLEETLLEYGELESESDVNRVLNDFLQKPVNARLREQKQNRLIRMAENGFGEWFLENYPDMDPIQVWEKIADALETEMDRKTVVIGVKIYDIFNLVVNGRYLELPADVPIPCDLQVERVAVASGLTNIEDKSSVMEAWAHVMQSVNEELEKPVSMLRIDSIVWQAGQIISKNDDQRSASRHALEEHFDHVGLKEQDSERLAHELTVGLEA",
                cigar:"37I2M2D16MD17M14I21MIMIMI11M7I6M2I3M10I7MI4MD17M2I2D2IMIM2I6MI4M3I2M2I3M3I45MI18M3IMIMI2M3I4M6D2M7I10M5I4M5IM4I13MI11M10D9M7I",
                sequence_start:15,
                number_shuffled_hits:number_shuffled_hits
            });
            for (var i=1;i< x.sequence.length;i++) {
                var col = x.getColumnFromResidue(i);
                if (col > 0 ) {
                    x.sequence[i-1].should.equal(x.alignment[col-1+number_shuffled_hits]);
                }
            }
        });

    });


    describe('trying with family PF09171', function () {
        it('should calculate the sequence coordinate from a cigar for O28951', function () {
            var x = new ActiveSitesAdder({
                sequence:"MMEYKIVENGLTYRIGNGASVPISNTGELIKGLRNYGPYEVPSLKYNQIALIHNNQFSSLINQLKSQISSKIDEVWHIHNINISEFIYDSPHFDSIKSQVDNAIDTGVDGIMLVLPEYNTPLYYKLKSYLINSIPSQFMRYDILSNRNLTFYVDNLLVQFVSKLGGKPWILNVDPEKGSDIIIGTGATRIDNVNLFCFAMVFKKDGTMLWNEISPIVTSSEYLTYLKSTIKKVVYGFKKSNPDWDVEKLTLHVSGKRPKMKDGETKILKETVEELKKQEMVSRDVKYAILHLNETHPFWVMGDPNNRFHPYEGTKVKLSSKRYLLTLLQPYLKRNGLEMVTPIKPLSVEIVSDNWTSEEYYHNVHEILDEIYYLSKMNWRGFRSRNLPVTVNYPKLVAGIIANVNRYGGYPINPEGNRSLQTNPWFL",
                cigar:"135IMD7M3IM4IM2IM3I2M3I2M2IMIMI2MIM2IMIM3IM3IM2ID2ID2IM9I4M3I2MIM2IM2I7M19ID3M3I4MIMIM7IM10I4M10IM10IM2I2M4ID5I3M6IMIMIMIMIMI2M2D16I4D34I2D3I3M2I8M45I7M2I2M7IM3IMIMI3M3IM3IM2IM5IM5IM4IM4IM5IM5IM4I2MIM9IM15IM8IM7IM6IM8IM9IMIM6I2M6I3M51IMI2M3IMIMIM7IM3IM3IM8IM12IM8IM11IM7IM9IM8IM12IM8IM3IM3I2M3I2M5IM4IM15IM2IMID2I2D11ID2MIM2IMIMI2M2I3M2IMIM3IM2IM2IMIMI2M24IMIM3IM5IM6IM2I3M10I4MI6M3IM2IM3I4M7IM7I2M3IMI4M67I5M2IMIM6I2M2IMI2M20I4M2IM3IM2IM6IM3IM3IM7IM8IM4IM3IM3IMIMIM6IM2IM3IM10IM6IM16IM6IM4IM3IM3IM4IM4IM7I2M2IM10IM6IM3IM4IM4IM15ID15ID10IM5IM11IM3IM5I2M3I3M4I4M12I6MIMI4MIMI2MIM17IMIMI3M5IM2I17MDM93I",
                sequence_start:110,
                model_start:2,
                number_shuffled_hits:0
            });
            for (var i=1;i< x.sequence.length;i++) {
                var col = x.getColumnFromResidue(i);
                if (col > 0 ) {
                    x.sequence[i-1].should.equal(x.alignment[col-1]);
                }
            }
        });
    });

});